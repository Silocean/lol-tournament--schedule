export const LOLESPORTS_API_KEY =
  process.env.LOLESPORTS_API_KEY || '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'

export const LOLESPORTS_ORIGIN = 'https://esports-api.lolesports.com'
export const LOLESPORTS_BASE = `${LOLESPORTS_ORIGIN}/persisted/gw`
export const LOLESPORTS_ENDPOINTS = new Set(['getSchedule', 'getStandings', 'getLive', 'getTeams'])
