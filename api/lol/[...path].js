import { LOLESPORTS_API_KEY, LOLESPORTS_BASE, LOLESPORTS_ENDPOINTS } from '../../lib/lolesports.js'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'method not allowed' }, { status: 405 })
  }

  const url = new URL(request.url)
  const endpoint = url.pathname.replace(/^\/api\/lol\/?/, '').split('/')[0]
  if (!LOLESPORTS_ENDPOINTS.has(endpoint)) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  const target = new URL(`${LOLESPORTS_BASE}/${endpoint}`)
  target.search = url.search

  try {
    const upstream = await fetch(target, {
      headers: {
        'x-api-key': LOLESPORTS_API_KEY,
        accept: 'application/json',
      },
    })
    const cacheControl = endpoint === 'getLive'
      ? 'public, s-maxage=5, stale-while-revalidate=15'
      : 'public, s-maxage=30, stale-while-revalidate=60'

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': cacheControl,
      },
    })
  } catch {
    return Response.json({ error: 'upstream failed' }, { status: 502 })
  }
}
