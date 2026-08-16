import { loadOfficialGpr } from '../lib/gpr.js'

export const config = { runtime: 'edge' }

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,OPTIONS',
      },
    })
  }

  if (request.method !== 'GET') {
    return Response.json({ error: 'method not allowed' }, { status: 405, headers: { 'cache-control': 'no-store' } })
  }

  try {
    const data = await loadOfficialGpr()
    return Response.json(data, {
      headers: {
        'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    })
  } catch {
    return Response.json({ error: 'gpr upstream failed' }, { status: 502, headers: { 'cache-control': 'no-store' } })
  }
}
