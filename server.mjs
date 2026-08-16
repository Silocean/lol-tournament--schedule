import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadOfficialGpr } from './lib/gpr.js'
import { LOLESPORTS_API_KEY, LOLESPORTS_ORIGIN } from './lib/lolesports.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = Number(process.env.PORT || 5173)
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers)
  res.end(body)
}

function proxyLol(req, res) {
  const targetPath = req.url.replace(/^\/api\/lol/, '/persisted/gw')
  const target = new URL(`${LOLESPORTS_ORIGIN}${targetPath}`)
  const proxyReq = https.request(
    target,
    {
      method: req.method,
      headers: {
        'x-api-key': LOLESPORTS_API_KEY,
        accept: 'application/json',
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, {
        'content-type': proxyRes.headers['content-type'] || 'application/json',
        'cache-control': 'no-store',
      })
      proxyRes.pipe(res)
    },
  )
  proxyReq.on('error', () => send(res, 502, JSON.stringify({ error: 'upstream failed' })))
  proxyReq.end()
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const rel = urlPath === '/' ? '/index.html' : urlPath
  const file = path.normalize(path.join(DIST, rel))
  if (!file.startsWith(DIST)) return send(res, 403, 'Forbidden')
  fs.readFile(file, (err, data) => {
    if (err) {
      if (path.extname(rel)) return send(res, 404, 'Not Found')
      return fs.readFile(path.join(DIST, 'index.html'), (err2, html) => {
        if (err2) return send(res, 404, 'Not Found')
        send(res, 200, html, { 'content-type': MIME['.html'] })
      })
    }
    send(res, 200, data, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' })
  })
}

async function serveGpr(_req, res) {
  try {
    const data = await loadOfficialGpr()
    send(res, 200, JSON.stringify(data), {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=600',
    })
  } catch {
    send(res, 502, JSON.stringify({ error: 'gpr upstream failed' }), {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    })
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/gpr')) return serveGpr(req, res)
  if (req.url.startsWith('/api/lol')) return proxyLol(req, res)
  serveStatic(req, res)
})

if (!fs.existsSync(DIST)) {
  console.error('未找到 dist，请先执行 npm run build')
  process.exit(1)
}

server.listen(PORT, () => {
  console.log(`LPL 赛程页: http://localhost:${PORT}`)
})
