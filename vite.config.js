import { defineConfig } from 'vite'
import { loadOfficialGpr } from './lib/gpr.js'
import { LOLESPORTS_API_KEY, LOLESPORTS_ORIGIN } from './lib/lolesports.js'

function gprMiddleware() {
  return {
    name: 'gpr-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (path !== '/api/gpr') return next()
        try {
          const data = await loadOfficialGpr()
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.setHeader('cache-control', 'no-store')
          res.end(JSON.stringify(data))
        } catch {
          res.statusCode = 502
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'gpr upstream failed' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [gprMiddleware()],
  server: {
    port: 5173,
    proxy: {
      '/api/lol': {
        target: LOLESPORTS_ORIGIN,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lol/, '/persisted/gw'),
        headers: {
          'x-api-key': LOLESPORTS_API_KEY,
        },
      },
    },
  },
})
