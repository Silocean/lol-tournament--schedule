const LEAGUE_ID = '98767991314006698'

export const SPLITS = [
  {
    id: 's1',
    name: '第一赛段',
    tournamentId: '115610660442964993',
    start: '2026-01-13',
    end: '2026-03-08',
  },
  {
    id: 's2',
    name: '第二赛段',
    tournamentId: '115615907996665826',
    start: '2026-04-03',
    end: '2026-06-14',
  },
  {
    id: 's3',
    name: '第三赛段',
    tournamentId: '115616254668930796',
    start: '2026-07-21',
    end: '2026-09-19',
    current: true,
    venues: [
      { week: 1, label: '第 1 周', start: '2026-07-22', end: '2026-07-26', city: '深圳', host: 'NIP 主场' },
      { week: 2, label: '第 2 周', start: '2026-07-29', end: '2026-08-02', city: '上海', host: 'IG 主场' },
      { week: 3, label: '第 3 周', start: '2026-08-05', end: '2026-08-09', city: '北京', host: 'JDG 主场' },
      { week: 4, label: '第 4 周', start: '2026-08-12', end: '2026-08-16', city: '苏州', host: 'LNG 主场' },
      { week: 5, label: '第 5 周', start: '2026-08-19', end: '2026-08-23', city: '西安', host: 'WE 主场' },
    ],
  },
]

export const TEAM_CN = {
  AL: "Anyone's Legend",
  BLG: '哔哩哔哩',
  EDG: '爱德华',
  JDG: '京东',
  LGD: 'LGD',
  TES: '滔搏',
  TT: '超玩者',
  WE: '西安 WE',
  IG: '无敌',
  LNG: 'LNG',
  NIP: 'NIP',
  WBG: '微博',
}

export const ASCENT_TEAMS = new Set(['AL', 'BLG', 'EDG', 'JDG', 'LGD', 'TES', 'TT', 'WE'])
export const NIRVANA_TEAMS = new Set(['IG', 'LNG', 'NIP', 'WBG'])

const CACHE_KEY = 'lpl-schedule-cache-v1'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function fetchSchedulePage(pageToken) {
  const params = new URLSearchParams({ hl: 'zh-CN', leagueId: LEAGUE_ID })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await fetchJson(`/api/lol/getSchedule?${params}`)
  return data?.data?.schedule || { events: [], pages: {} }
}

let eventsCache = null

export function rememberEvents(events) {
  eventsCache = events
}

export async function fetchAllSchedule(force = false) {
  if (eventsCache && !force) return eventsCache

  const events = []
  let page = await fetchSchedulePage()
  events.push(...(page.events || []))

  let token = page.pages?.older
  const newerToken = page.pages?.newer
  const seen = new Set()
  while (token && !seen.has(token) && seen.size < 12) {
    seen.add(token)
    page = await fetchSchedulePage(token)
    const batch = page.events || []
    events.push(...batch)
    const oldest = batch.reduce((min, e) => (e.startTime < min ? e.startTime : min), '9999')
    if (oldest < '2026-01-01') break
    token = page.pages?.older
  }

  token = newerToken
  const seenNewer = new Set()
  while (token && !seenNewer.has(token) && seenNewer.size < 6) {
    seenNewer.add(token)
    page = await fetchSchedulePage(token)
    events.push(...(page.events || []))
    token = page.pages?.newer
  }

  const uniq = new Map()
  for (const event of events) {
    const id = event.match?.id || `${event.startTime}-${event.blockName}`
    uniq.set(id, event)
  }
  eventsCache = [...uniq.values()].sort((a, b) => a.startTime.localeCompare(b.startTime))
  return eventsCache
}

export async function fetchStandings(tournamentId) {
  const data = await fetchJson(`/api/lol/getStandings?hl=zh-CN&tournamentId=${tournamentId}`)
  return data?.data?.standings || []
}

export async function fetchLive() {
  const data = await fetchJson('/api/lol/getLive?hl=zh-CN')
  const events = data?.data?.schedule?.events || []
  return events.filter((e) => e.league?.slug === 'lpl' || e.league?.name === 'LPL')
}

export function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
  } catch {
    return null
  }
}

export function writeCache(payload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}

export async function loadSnapshot() {
  try {
    return await fetchJson('/snapshot.json')
  } catch {
    return null
  }
}

export async function loadLplData(split, { force = false } = {}) {
  const [events, standings, live] = await Promise.all([
    fetchAllSchedule(force),
    fetchStandings(split.tournamentId),
    fetchLive().catch(() => []),
  ])
  const prev = readCache() || {}
  const payload = {
    fetchedAt: new Date().toISOString(),
    events,
    standings: { ...(prev.standings || {}), [split.tournamentId]: { data: { standings } } },
    live,
  }
  writeCache(payload)
  return payload
}
