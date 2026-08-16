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

/** LoL Esports getTeams slug，按战队代码索引 */
export const TEAM_SLUGS = {
  AL: 'anyones-legend',
  BLG: 'bilibili-gaming',
  EDG: 'edward-gaming',
  JDG: 'jd-gaming',
  LGD: 'lgd-gaming',
  TES: 'top-esports',
  TT: 'thunder-talk-gaming',
  WE: 'team-we',
  IG: 'invictus-gaming',
  LNG: 'lng-esports',
  NIP: 'shenzen-ninjas-in-pyjamas',
  WBG: 'weibo-gaming',
}

export const ROLE_CN = {
  top: '上单',
  jungle: '打野',
  mid: '中单',
  bottom: 'ADC',
  support: '辅助',
}

export const ROLE_ORDER = ['top', 'jungle', 'mid', 'bottom', 'support']

export const ASCENT_TEAMS = new Set(['AL', 'BLG', 'EDG', 'JDG', 'LGD', 'TES', 'TT', 'WE'])
export const NIRVANA_TEAMS = new Set(['IG', 'LNG', 'NIP', 'WBG'])

const CACHE_KEY = 'lpl-schedule-cache-v2'
const TEAM_CACHE_KEY = 'lpl-teams-cache-v1'

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function fetchSchedulePage(pageToken) {
  const params = new URLSearchParams({ hl: 'zh-CN', leagueId: LEAGUE_ID })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await fetchJson(`/api/lol/getSchedule?${params}`)
  return data?.data?.schedule || { events: [], pages: {} }
}

function eventDay(event) {
  // schedule times are UTC; LPL days are CST (= UTC+8)
  const d = new Date(Date.parse(event.startTime) + 8 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

function coversSplit(events, split) {
  if (!events.length) return false
  const days = events.map(eventDay)
  return Math.min(...days) <= split.start && Math.max(...days) >= split.end
}

function uniqueEvents(events) {
  const uniq = new Map()
  for (const event of events) {
    const id = event.match?.id || `${event.startTime}-${event.blockName}`
    uniq.set(id, event)
  }
  return [...uniq.values()].sort((a, b) => a.startTime.localeCompare(b.startTime))
}

let eventsCache = null

export function rememberEvents(events) {
  eventsCache = events
}

export async function fetchAllSchedule(force = false, split = SPLITS.find((s) => s.current) || SPLITS[2]) {
  if (eventsCache && !force) return eventsCache

  const events = []
  let page = await fetchSchedulePage()
  events.push(...(page.events || []))

  let token = page.pages?.older
  const newerToken = page.pages?.newer
  const seen = new Set()
  while (token && !seen.has(token) && seen.size < 8) {
    seen.add(token)
    try {
      page = await fetchSchedulePage(token)
    } catch (err) {
      console.warn('schedule older page failed', err)
      break
    }
    const batch = page.events || []
    if (!batch.length) break
    events.push(...batch)
    const oldest = batch.reduce((min, e) => (e.startTime < min ? e.startTime : min), '9999')
    if (oldest < `${split.start}T00:00:00Z`) break
    if (coversSplit(events, split)) break
    token = page.pages?.older
  }

  token = newerToken
  const seenNewer = new Set()
  while (token && !seenNewer.has(token) && seenNewer.size < 4) {
    seenNewer.add(token)
    try {
      page = await fetchSchedulePage(token)
    } catch (err) {
      console.warn('schedule newer page failed', err)
      break
    }
    const batch = page.events || []
    if (!batch.length) break
    events.push(...batch)
    token = page.pages?.newer
  }

  eventsCache = uniqueEvents(events)
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

const teamMemory = new Map()

function readTeamCache() {
  try {
    return JSON.parse(localStorage.getItem(TEAM_CACHE_KEY) || 'null') || {}
  } catch {
    return {}
  }
}

function writeTeamCache(map) {
  try {
    localStorage.setItem(TEAM_CACHE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

function rememberTeam(team) {
  if (!team?.code) return team
  teamMemory.set(team.code, team)
  const stored = readTeamCache()
  stored[team.code] = { savedAt: new Date().toISOString(), team }
  writeTeamCache(stored)
  return team
}

function cachedTeam(code) {
  if (teamMemory.has(code)) return teamMemory.get(code)
  const entry = readTeamCache()[code]
  if (entry?.team) {
    teamMemory.set(code, entry.team)
    return entry.team
  }
  return null
}

export async function fetchTeamDetail(code, { force = false } = {}) {
  if (!code || code === 'TBD') return null
  if (!force) {
    const hit = cachedTeam(code)
    if (hit) return hit
  }

  const slug = TEAM_SLUGS[code]
  if (slug) {
    const data = await fetchJson(`/api/lol/getTeams?hl=zh-CN&id=${encodeURIComponent(slug)}`)
    const team = (data?.data?.teams || []).find((t) => t.code === code) || data?.data?.teams?.[0]
    if (team) return rememberTeam(team)
  }

  // 未知 slug：拉取全量后按 code / LPL 赛区匹配
  const data = await fetchJson('/api/lol/getTeams?hl=zh-CN')
  const teams = data?.data?.teams || []
  const match =
    teams.find((t) => t.code === code && (t.homeLeague?.name || '').toUpperCase() === 'LPL') ||
    teams.find((t) => t.code === code)
  if (match) return rememberTeam(match)
  return null
}

export async function prefetchLplTeams() {
  const codes = Object.keys(TEAM_SLUGS)
  await Promise.allSettled(codes.map((code) => fetchTeamDetail(code)))
}

export async function loadSnapshot() {
  try {
    return await fetchJson('/snapshot.json')
  } catch {
    return null
  }
}

export async function loadLplData(split, { force = false } = {}) {
  const settled = await Promise.allSettled([
    fetchAllSchedule(force, split),
    fetchStandings(split.tournamentId),
    fetchLive(),
  ])

  const eventsResult = settled[0]
  const standingsResult = settled[1]
  const liveResult = settled[2]

  if (eventsResult.status !== 'fulfilled' || !eventsResult.value?.length) {
    const reason = eventsResult.status === 'rejected' ? eventsResult.reason : new Error('empty schedule')
    throw reason
  }

  const prev = readCache() || {}
  const standings =
    standingsResult.status === 'fulfilled'
      ? standingsResult.value
      : prev.standings?.[split.tournamentId]?.data?.standings || []
  const live = liveResult.status === 'fulfilled' ? liveResult.value : []

  // 后台预取战队阵容，不阻塞赛程渲染
  prefetchLplTeams().catch((err) => console.warn('prefetch teams failed', err))

  const payload = {
    fetchedAt: new Date().toISOString(),
    events: eventsResult.value,
    standings: { ...(prev.standings || {}), [split.tournamentId]: { data: { standings } } },
    live,
    partial: standingsResult.status !== 'fulfilled' || liveResult.status !== 'fulfilled',
  }
  writeCache(payload)
  return payload
}
