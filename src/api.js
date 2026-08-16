export const LEAGUES = {
  lpl: {
    id: '98767991314006698',
    slug: 'lpl',
    code: 'LPL',
    name: '英雄联盟职业联赛',
    region: '中国大陆赛区',
    tzOffsetHours: 8,
    tzLabel: '北京时间',
    default: true,
    splits: [
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
    ],
    teamNames: {
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
    },
    teamSlugs: {
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
    },
    ascentTeams: ['AL', 'BLG', 'EDG', 'JDG', 'LGD', 'TES', 'TT', 'WE'],
    nirvanaTeams: ['IG', 'LNG', 'NIP', 'WBG'],
    stageFilters: [
      { id: 'all', label: '全部阶段' },
      { id: 'regular', label: '组内赛' },
      { id: 'knights', label: '骑士之路' },
      { id: 'playoffs', label: '季后赛' },
      { id: 'qualifier', label: '资格赛' },
    ],
  },
  lck: {
    id: '98767991310872058',
    slug: 'lck',
    code: 'LCK',
    name: '英雄联盟韩国冠军联赛',
    region: '韩国赛区',
    tzOffsetHours: 9,
    tzLabel: '韩国时间',
    splits: [
      {
        id: 's1',
        name: '第一赛段',
        tournamentId: '115548106590082745',
        start: '2026-01-13',
        end: '2026-03-01',
      },
      {
        id: 's2',
        name: '第二赛段',
        tournamentId: '115548128960088078',
        start: '2026-03-31',
        end: '2026-06-14',
      },
      {
        id: 's3',
        name: '第三赛段',
        tournamentId: '115548147890329817',
        start: '2026-07-28',
        end: '2026-09-13',
        current: true,
      },
    ],
    teamNames: {
      T1: 'T1',
      GEN: 'Gen.G',
      HLE: '韩华生命',
      KT: 'KT Rolster',
      DK: 'Dplus KIA',
      KRX: 'DRX',
      BRO: 'BRION',
      NS: 'Nongshim',
      BFX: 'BNK FEARX',
      DNS: 'DN SOOPers',
    },
    teamSlugs: {
      T1: 't1',
      GEN: 'geng',
      HLE: 'hanwha-life-esports',
      KT: 'kt-rolster',
      DK: 'dwg-kia',
      KRX: 'drx',
      BRO: 'fredit-brion',
      NS: 'nongshim-redforce',
      BFX: 'fearx',
      DNS: 'kwangdong-freecs',
    },
    ascentTeams: [],
    nirvanaTeams: [],
    stageFilters: [
      { id: 'all', label: '全部阶段' },
      { id: 'regular', label: '组内赛' },
      { id: 'knights', label: '入围赛' },
      { id: 'playoffs', label: '淘汰赛' },
      { id: 'qualifier', label: '资格赛' },
    ],
  },
}

export const LEAGUE_ORDER = ['lpl', 'lck']

export const ROLE_CN = {
  top: '上单',
  jungle: '打野',
  mid: '中单',
  bottom: 'ADC',
  support: '辅助',
}

export const ROLE_ORDER = ['top', 'jungle', 'mid', 'bottom', 'support']

const LEAGUE_STORAGE_KEY = 'esports-active-league'
const TEAM_CACHE_KEY = 'esports-teams-cache-v1'

export function getLeague(leagueId = 'lpl') {
  return LEAGUES[leagueId] || LEAGUES.lpl
}

export function readStoredLeagueId() {
  try {
    const id = localStorage.getItem(LEAGUE_STORAGE_KEY)
    if (id && LEAGUES[id]) return id
  } catch {
    /* ignore */
  }
  return 'lpl'
}

export function writeStoredLeagueId(leagueId) {
  try {
    localStorage.setItem(LEAGUE_STORAGE_KEY, leagueId)
  } catch {
    /* ignore */
  }
}

function cacheKey(leagueId) {
  return `esports-schedule-cache-v1-${leagueId}`
}

/** @deprecated use getLeague().splits — kept for older imports */
export const SPLITS = LEAGUES.lpl.splits
export const TEAM_CN = LEAGUES.lpl.teamNames
export const TEAM_SLUGS = {
  ...LEAGUES.lpl.teamSlugs,
  ...LEAGUES.lck.teamSlugs,
}
export const ASCENT_TEAMS = new Set(LEAGUES.lpl.ascentTeams)
export const NIRVANA_TEAMS = new Set(LEAGUES.lpl.nirvanaTeams)

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function fetchSchedulePage(leagueId, pageToken) {
  const league = getLeague(leagueId)
  const params = new URLSearchParams({ hl: 'zh-CN', leagueId: league.id })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await fetchJson(`/api/lol/getSchedule?${params}`)
  return data?.data?.schedule || { events: [], pages: {} }
}

function eventDay(event, offsetHours = 8) {
  const d = new Date(Date.parse(event.startTime) + offsetHours * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

function coversSplit(events, split, offsetHours) {
  if (!events.length) return false
  const days = events.map((e) => eventDay(e, offsetHours))
  return Math.min(...days) <= split.start && Math.max(...days) >= split.end
}

function uniqueEvents(events) {
  const uniq = new Map()
  for (const event of events) {
    if (!isMatchEvent(event)) continue
    const id = event.match?.id || `${event.startTime}-${event.blockName}`
    uniq.set(id, event)
  }
  return [...uniq.values()].sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function isMatchEvent(event) {
  if (!event) return false
  if (event.type && event.type !== 'match') return false
  const teams = event.match?.teams || []
  return teams.some((t) => t?.code && t.code !== 'TBD')
}

const eventsCacheByLeague = new Map()

export async function fetchAllSchedule(
  leagueId,
  force = false,
  split = getLeague(leagueId).splits.find((s) => s.current) || getLeague(leagueId).splits.at(-1),
) {
  if (!force && eventsCacheByLeague.has(leagueId)) return eventsCacheByLeague.get(leagueId)

  const league = getLeague(leagueId)
  const offset = league.tzOffsetHours
  const events = []
  let page = await fetchSchedulePage(leagueId)
  events.push(...(page.events || []))

  let token = page.pages?.older
  const newerToken = page.pages?.newer
  const seen = new Set()
  while (token && !seen.has(token) && seen.size < 8) {
    seen.add(token)
    try {
      page = await fetchSchedulePage(leagueId, token)
    } catch (err) {
      console.warn('schedule older page failed', err)
      break
    }
    const batch = page.events || []
    if (!batch.length) break
    events.push(...batch)
    const oldest = batch.reduce((min, e) => (e.startTime < min ? e.startTime : min), '9999')
    if (oldest < `${split.start}T00:00:00Z`) break
    if (coversSplit(events, split, offset)) break
    token = page.pages?.older
  }

  token = newerToken
  const seenNewer = new Set()
  while (token && !seenNewer.has(token) && seenNewer.size < 4) {
    seenNewer.add(token)
    try {
      page = await fetchSchedulePage(leagueId, token)
    } catch (err) {
      console.warn('schedule newer page failed', err)
      break
    }
    const batch = page.events || []
    if (!batch.length) break
    events.push(...batch)
    token = page.pages?.newer
  }

  const uniq = uniqueEvents(events)
  eventsCacheByLeague.set(leagueId, uniq)
  return uniq
}

export async function fetchStandings(tournamentId) {
  const data = await fetchJson(`/api/lol/getStandings?hl=zh-CN&tournamentId=${tournamentId}`)
  return data?.data?.standings || []
}

export async function fetchLive(leagueSlug = 'lpl') {
  const data = await fetchJson('/api/lol/getLive?hl=zh-CN')
  const events = data?.data?.schedule?.events || []
  const slug = String(leagueSlug).toLowerCase()
  return events.filter((e) => {
    const s = (e.league?.slug || '').toLowerCase()
    const n = (e.league?.name || '').toLowerCase()
    if (s !== slug && n !== slug) return false
    return isMatchEvent(e)
  })
}

export function readCache(leagueId = 'lpl') {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(leagueId)) || 'null')
  } catch {
    return null
  }
}

export function writeCache(leagueId, payload) {
  try {
    localStorage.setItem(cacheKey(leagueId), JSON.stringify(payload))
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

export async function fetchTeamDetail(code, { force = false, leagueId = 'lpl' } = {}) {
  if (!code || code === 'TBD') return null
  if (!force) {
    const hit = cachedTeam(code)
    if (hit) return hit
  }

  const league = getLeague(leagueId)
  const slug = league.teamSlugs[code] || TEAM_SLUGS[code]
  if (slug) {
    const data = await fetchJson(`/api/lol/getTeams?hl=zh-CN&id=${encodeURIComponent(slug)}`)
    const team = (data?.data?.teams || []).find((t) => t.code === code) || data?.data?.teams?.[0]
    if (team) return rememberTeam(team)
  }

  const data = await fetchJson('/api/lol/getTeams?hl=zh-CN')
  const teams = data?.data?.teams || []
  const leagueName = league.code
  const match =
    teams.find((t) => t.code === code && (t.homeLeague?.name || '').toUpperCase() === leagueName) ||
    teams.find((t) => t.code === code)
  if (match) return rememberTeam(match)
  return null
}

export async function prefetchLeagueTeams(leagueId = 'lpl') {
  const codes = Object.keys(getLeague(leagueId).teamSlugs)
  await Promise.allSettled(codes.map((code) => fetchTeamDetail(code, { leagueId })))
}

export async function loadSnapshot() {
  try {
    return await fetchJson('/snapshot.json')
  } catch {
    return null
  }
}

export async function loadLeagueData(leagueId, split, { force = false } = {}) {
  const league = getLeague(leagueId)
  const settled = await Promise.allSettled([
    fetchAllSchedule(leagueId, force, split),
    fetchStandings(split.tournamentId),
    fetchLive(league.slug),
  ])

  const eventsResult = settled[0]
  const standingsResult = settled[1]
  const liveResult = settled[2]

  if (eventsResult.status !== 'fulfilled' || !eventsResult.value?.length) {
    const reason = eventsResult.status === 'rejected' ? eventsResult.reason : new Error('empty schedule')
    throw reason
  }

  const prev = readCache(leagueId) || {}
  const standings =
    standingsResult.status === 'fulfilled'
      ? standingsResult.value
      : prev.standings?.[split.tournamentId]?.data?.standings || []
  const live = liveResult.status === 'fulfilled' ? liveResult.value : []

  prefetchLeagueTeams(leagueId).catch((err) => console.warn('prefetch teams failed', err))

  const payload = {
    leagueId,
    fetchedAt: new Date().toISOString(),
    events: eventsResult.value,
    standings: { ...(prev.standings || {}), [split.tournamentId]: { data: { standings } } },
    live,
    partial: standingsResult.status !== 'fulfilled' || liveResult.status !== 'fulfilled',
  }
  writeCache(leagueId, payload)
  return payload
}
