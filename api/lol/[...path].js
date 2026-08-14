import {
  LOLESPORTS_API_KEY,
  LOLESPORTS_BASE,
  LOLESPORTS_ENDPOINTS,
} from '../../lib/lolesports.js'

export const config = { runtime: 'edge' }

const ALLOWED_PARAMS = {
  getSchedule: ['hl', 'leagueId', 'pageToken'],
  getStandings: ['hl', 'tournamentId'],
  getLive: ['hl'],
}

function buildTarget(endpoint, incoming) {
  const target = new URL(`${LOLESPORTS_BASE}/${endpoint}`)
  const allowed = ALLOWED_PARAMS[endpoint] || []
  for (const key of allowed) {
    const values = incoming.searchParams.getAll(key)
    for (const value of values) {
      if (value) target.searchParams.append(key, value)
    }
  }
  if (!target.searchParams.has('hl')) target.searchParams.set('hl', 'zh-CN')
  return target
}

function cacheControlFor(endpoint, status) {
  if (status >= 400) return 'no-store'
  if (endpoint === 'getLive') return 'public, s-maxage=5, stale-while-revalidate=15'
  return 'public, s-maxage=30, stale-while-revalidate=60'
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,OPTIONS',
        'access-control-allow-headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'GET') {
    return Response.json({ error: 'method not allowed' }, { status: 405, headers: { 'cache-control': 'no-store' } })
  }

  const url = new URL(request.url)
  const endpoint = url.pathname.replace(/^\/api\/lol\/?/, '').split('/').filter(Boolean)[0]
  if (!LOLESPORTS_ENDPOINTS.has(endpoint)) {
    return Response.json({ error: 'not found' }, { status: 404, headers: { 'cache-control': 'no-store' } })
  }

  const target = buildTarget(endpoint, url)

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'x-api-key': LOLESPORTS_API_KEY,
        accept: 'application/json',
      },
      cache: 'no-store',
    })
    const body = await upstream.arrayBuffer()
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': cacheControlFor(endpoint, upstream.status),
      },
    })
  } catch {
    return Response.json({ error: 'upstream failed' }, { status: 502, headers: { 'cache-control': 'no-store' } })
  }
}
