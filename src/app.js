import {
  ASCENT_TEAMS,
  NIRVANA_TEAMS,
  SPLITS,
  TEAM_CN,
  loadLplData,
  loadSnapshot,
  readCache,
} from './api.js'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export const state = {
  splitId: SPLITS.find((s) => s.current)?.id || 's3',
  filter: 'all',
  team: '',
  stage: 'all',
  events: [],
  standings: [],
  liveIds: new Set(),
  fetchedAt: null,
  source: 'live',
}

export function currentSplit() {
  return SPLITS.find((s) => s.id === state.splitId) || SPLITS[2]
}

export function toCST(iso) {
  return new Date(Date.parse(iso) + 8 * 3600 * 1000)
}

export function cstDateKey(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? toCST(isoOrDate) : isoOrDate
  return d.toISOString().slice(0, 10)
}

export function todayCST() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

export function formatDate(iso) {
  const d = toCST(iso)
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日 周${WEEKDAYS[d.getUTCDay()]}`
}

export function formatTime(iso) {
  const d = toCST(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

export function httpsUrl(url) {
  return (url || '').replace(/^http:\/\//, 'https://')
}

export function teamLabel(team) {
  return TEAM_CN[team.code] || team.name || team.code
}

export function stageOf(event) {
  const block = event.blockName || ''
  if (block.includes('资格')) return 'qualifier'
  if (block.includes('骑士') || block.includes('入围')) return 'knights'
  if (block.includes('淘汰') || block.includes('决赛')) return 'playoffs'
  return 'regular'
}

function seriesTargetWins(event) {
  return Math.ceil((Number(event.match?.strategy?.count) || 1) / 2)
}

function isSeriesDecided(event) {
  const teams = event.match?.teams || []
  const target = seriesTargetWins(event)
  const wins = teams.map((t) => Number(t.result?.gameWins) || 0)
  if (wins.some((w) => w >= target)) return true
  if (target === 1) {
    return teams.some((t) => t.result?.outcome === 'win' || t.result?.outcome === 'loss')
  }
  return false
}

function gamesPlayed(event) {
  return (event.match?.teams || []).reduce((sum, t) => sum + (Number(t.result?.gameWins) || 0), 0)
}

function hasGameplayStarted(event) {
  if (gamesPlayed(event) > 0) return true
  return (event.match?.games || []).some((g) => g.state === 'inProgress' || g.state === 'completed')
}

function liveGameLabel(event) {
  const games = event.match?.games || []
  const playing = games.find((g) => g.state === 'inProgress')
  if (playing?.number) return `第${playing.number}局`
  const played = gamesPlayed(event)
  if (played > 0) return `第${played + 1}局`
  return ''
}

export function matchStatus(event, now = Date.now()) {
  if (isSeriesDecided(event)) return 'completed'
  if (hasGameplayStarted(event)) return 'live'

  const start = Date.parse(event.startTime)
  if (!Number.isFinite(start) || start > now) return 'upcoming'
  return 'upcoming'
}

export function countdown(iso, now = Date.now()) {
  let diff = Date.parse(iso) - now
  if (diff <= 0) return ''
  const days = Math.floor(diff / 86400000)
  diff %= 86400000
  const hours = Math.floor(diff / 3600000)
  diff %= 3600000
  const mins = Math.floor(diff / 60000)
  if (days > 0) return `${days}天${hours}小时后`
  if (hours > 0) return `${hours}小时${mins}分后`
  return `${mins}分钟后`
}

export function venueForDate(iso) {
  const split = currentSplit()
  if (!split.venues) return null
  const key = cstDateKey(iso)
  return split.venues.find((v) => key >= v.start && key <= v.end) || null
}

export function activeVenue() {
  const split = currentSplit()
  if (!split.venues) return null
  const today = todayCST()
  return (
    split.venues.find((v) => today >= v.start && today <= v.end) ||
    split.venues.find((v) => today < v.start) ||
    split.venues.at(-1)
  )
}

export function splitEvents() {
  const split = currentSplit()
  return state.events.filter((e) => {
    const day = cstDateKey(e.startTime)
    return day >= split.start && day <= split.end
  })
}

export function filteredEvents() {
  const today = todayCST()
  return splitEvents()
    .filter((e) => {
      const status = matchStatus(e)
      if (state.filter === 'today') return cstDateKey(e.startTime) === today
      if (state.filter === 'upcoming') return status === 'upcoming' || status === 'live'
      if (state.filter === 'completed') return status === 'completed'
      return true
    })
    .filter((e) => (state.stage === 'all' ? true : stageOf(e) === state.stage))
    .filter((e) => {
      if (!state.team) return true
      return (e.match?.teams || []).some((t) => t.code === state.team)
    })
}

export function teamCodes() {
  const codes = new Map()
  for (const event of splitEvents()) {
    for (const team of event.match?.teams || []) {
      if (team.code) codes.set(team.code, team)
    }
  }
  return [...codes.values()]
    .filter((t) => t.code && t.code !== 'TBD')
    .sort((a, b) => a.code.localeCompare(b.code))
}

export function gameDiffMap() {
  const map = new Map()
  for (const event of splitEvents()) {
    if (matchStatus(event) !== 'completed') continue
    const teams = event.match?.teams || []
    if (teams.length < 2) continue
    const [a, b] = teams
    const aw = a.result?.gameWins || 0
    const bw = b.result?.gameWins || 0
    const recA = map.get(a.code) || { gf: 0, ga: 0 }
    const recB = map.get(b.code) || { gf: 0, ga: 0 }
    recA.gf += aw
    recA.ga += bw
    recB.gf += bw
    recB.ga += aw
    map.set(a.code, recA)
    map.set(b.code, recB)
  }
  return map
}

export function normalizeSections(standings) {
  const stages = standings?.[0]?.stages || []
  const groupStage = stages.find((s) => s.slug === 'group_stage') || stages[0]
  const sections = (groupStage?.sections || []).map((section) => {
    const codes = new Set(
      (section.rankings || []).flatMap((row) => (row.teams || []).map((t) => t.code)),
    )
    const ascentN = [...codes].filter((c) => ASCENT_TEAMS.has(c)).length
    const nirvanaN = [...codes].filter((c) => NIRVANA_TEAMS.has(c)).length
    let name = section.name
    if (ascentN >= 6) name = '登峰组'
    else if (nirvanaN >= 3) name = '涅槃组'
    return { ...section, name }
  })
  const order = { 登峰组: 0, 涅槃组: 1 }
  sections.sort((a, b) => (order[a.name] ?? 9) - (order[b.name] ?? 9))
  return sections
}

function promotionTag(groupName, rank, groupSize) {
  if (groupName === '登峰组') {
    if (rank <= 6) return { text: '直接晋级', cls: 'ok' }
    return { text: '骑士之路', cls: 'warn' }
  }
  if (groupName === '涅槃组') {
    if (rank <= 2) return { text: '骑士之路', cls: 'warn' }
    return { text: '淘汰区', cls: 'bad' }
  }
  if (rank <= Math.ceil(groupSize / 2)) return { text: '晋级区', cls: 'ok' }
  return { text: '', cls: '' }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function teamCell(team, align = 'left', winnerCode) {
  const cls = [
    'team',
    align === 'right' ? 'right' : '',
    winnerCode && team.code === winnerCode ? 'winner' : '',
    winnerCode && team.code !== winnerCode ? 'loser' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return `
    <div class="${cls}">
      <img src="${httpsUrl(team.image)}" alt="${escapeHtml(team.code)}" />
      <div>
        <b>${escapeHtml(team.code)}</b>
        <small>${escapeHtml(teamLabel(team))}</small>
      </div>
    </div>
  `
}

function statusBadge(status, event) {
  if (status === 'live') {
    const game = liveGameLabel(event)
    return `<span class="badge live">LIVE${game ? ` · ${escapeHtml(game)}` : ''}</span>`
  }
  if (status === 'upcoming') {
    const start = Date.parse(event.startTime)
    const text = Number.isFinite(start) && start <= Date.now() ? '即将开始' : countdown(event.startTime) || '未开始'
    return `<span class="badge soon">${escapeHtml(text)}</span>`
  }
  return `<span class="badge done">已结束</span>`
}

export function renderClock() {
  const el = document.querySelector('#clock')
  if (!el) return
  const now = new Date(Date.now() + 8 * 3600 * 1000)
  el.textContent = `北京时间 ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`
}

export function renderSync(text, cls = '') {
  const el = document.querySelector('#sync-status')
  if (!el) return
  el.className = `sync ${cls}`
  el.textContent = text
}

export function renderHero() {
  const split = currentSplit()
  const venue = activeVenue()
  const today = todayCST()
  const todays = splitEvents()
    .filter((e) => cstDateKey(e.startTime) === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const title = venue
    ? `${venue.city} · ${venue.host}`
    : `${split.name}赛程`
  const subtitle = venue
    ? `${split.name}组内赛 ${venue.label}（${venue.start.slice(5).replace('-', '/')} - ${venue.end.slice(5).replace('-', '/')}）`
    : `${split.start.replaceAll('-', '.')} - ${split.end.replaceAll('-', '.')}`

  const next = splitEvents()
    .filter((e) => matchStatus(e) === 'upcoming' || matchStatus(e) === 'live')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0]

  document.querySelector('#hero').innerHTML = `
    <article class="hero-card">
      <div class="kicker">LPL 2026 · ${escapeHtml(split.name)}</div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(subtitle)}${next ? ` · 下一场 ${formatTime(next.startTime)} ${next.match?.teams?.[0]?.code || ''} vs ${next.match?.teams?.[1]?.code || ''}` : ''}</p>
    </article>
    <div class="today-list">
      <h3>今日赛程</h3>
      ${
        todays.length
          ? todays
              .map((event) => {
                const [home, away] = event.match?.teams || [{}, {}]
                const status = matchStatus(event)
                const score =
                  status === 'upcoming'
                    ? '<span class="vs">VS</span>'
                    : `${home.result?.gameWins ?? 0} : ${away.result?.gameWins ?? 0}`
                return `
                  <article class="today-card">
                    <div class="time">${formatTime(event.startTime)}<div>${statusBadge(status, event)}</div></div>
                    <div class="team-mini"><img src="${httpsUrl(home.image)}" alt=""><b>${escapeHtml(home.code || '')}</b></div>
                    <div class="score-mini">${score}</div>
                    <div class="team-mini right"><img src="${httpsUrl(away.image)}" alt=""><b>${escapeHtml(away.code || '')}</b></div>
                  </article>
                `
              })
              .join('')
          : `<article class="today-card"><div class="time">今日</div><div>今日暂无 LPL 比赛，看看即将到来的赛程吧。</div></article>`
      }
    </div>
  `

  const venuesEl = document.querySelector('#venues')
  if (!split.venues) {
    venuesEl.innerHTML = ''
    venuesEl.style.display = 'none'
    return
  }
  venuesEl.style.display = 'grid'
  venuesEl.innerHTML = split.venues
    .map((v) => {
      const active = venue && v.week === venue.week
      return `
        <div class="venue ${active ? 'active' : ''}">
          <div class="city">${escapeHtml(v.city)} · ${escapeHtml(v.host)}</div>
          <div class="meta">${escapeHtml(v.label)} · ${v.start.slice(5).replace('-', '/')} - ${v.end.slice(5).replace('-', '/')}</div>
        </div>
      `
    })
    .join('')
}

export function renderFilters() {
  const teams = teamCodes()
  document.querySelector('#filters').innerHTML = `
    ${['all:全部', 'today:今日', 'upcoming:未赛', 'completed:赛果']
      .map((item) => {
        const [id, label] = item.split(':')
        return `<button class="chip ${state.filter === id ? 'active' : ''}" data-filter="${id}">${label}</button>`
      })
      .join('')}
    <select class="select" data-stage>
      <option value="all">全部阶段</option>
      <option value="regular" ${state.stage === 'regular' ? 'selected' : ''}>组内赛</option>
      <option value="knights" ${state.stage === 'knights' ? 'selected' : ''}>骑士之路</option>
      <option value="playoffs" ${state.stage === 'playoffs' ? 'selected' : ''}>季后赛</option>
      <option value="qualifier" ${state.stage === 'qualifier' ? 'selected' : ''}>资格赛</option>
    </select>
    <select class="select" data-team>
      <option value="">全部战队</option>
      ${teams
        .map(
          (t) =>
            `<option value="${escapeHtml(t.code)}" ${state.team === t.code ? 'selected' : ''}>${escapeHtml(t.code)} · ${escapeHtml(teamLabel(t))}</option>`,
        )
        .join('')}
    </select>
    <select class="select" data-split>
      ${SPLITS.map(
        (s) =>
          `<option value="${s.id}" ${state.splitId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`,
      ).join('')}
    </select>
  `

  document.querySelector('#filters').onclick = (e) => {
    const btn = e.target.closest('[data-filter]')
    if (!btn) return
    state.filter = btn.dataset.filter
    renderAll()
  }
  document.querySelector('#filters').onchange = async (e) => {
    const el = e.target
    if (el.matches('[data-team]')) state.team = el.value
    if (el.matches('[data-stage]')) state.stage = el.value
    if (el.matches('[data-split]')) {
      state.splitId = el.value
      state.team = ''
      state.filter = 'all'
      await bootstrap({ silent: true, force: false })
      return
    }
    renderAll()
  }
}

export function renderSchedule() {
  const events = filteredEvents()
  const root = document.querySelector('#schedule')
  if (!events.length) {
    root.innerHTML = `<div class="empty">没有符合筛选条件的比赛</div>`
    return
  }

  const groups = new Map()
  for (const event of events) {
    const key = cstDateKey(event.startTime)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(event)
  }

  root.innerHTML = [...groups.entries()]
    .map(([day, list]) => {
      const venue = venueForDate(list[0].startTime)
      return `
        <section class="day-group">
          <div class="day-title">
            <strong>${formatDate(list[0].startTime)}</strong>
            <span>${venue ? `${venue.city} · ${venue.host}` : list[0].blockName || ''}</span>
          </div>
          ${list
            .map((event) => {
              const [home, away] = event.match?.teams || [{ code: 'TBD' }, { code: 'TBD' }]
              const status = matchStatus(event)
              const winner =
                status === 'completed'
                  ? home.result?.outcome === 'win'
                    ? home.code
                    : away.result?.outcome === 'win'
                      ? away.code
                      : ''
                  : ''
              const score =
                status === 'upcoming'
                  ? `<div class="vs">VS</div><small>${event.match?.strategy?.count ? `BO${event.match.strategy.count}` : ''}</small>`
                  : `${home.result?.gameWins ?? 0} : ${away.result?.gameWins ?? 0}`
              return `
                <article class="match ${status === 'live' ? 'live-row' : ''}">
                  <div class="time-col">
                    <b>${formatTime(event.startTime)}</b>
                    ${statusBadge(status, event)}
                  </div>
                  ${teamCell(home, 'left', winner)}
                  <div class="score">${score}</div>
                  ${teamCell(away, 'right', winner)}
                  <div class="match-meta">${escapeHtml(event.blockName || '')}<br>${escapeHtml(event.match?.strategy?.count ? `BO${event.match.strategy.count}` : '')}</div>
                </article>
              `
            })
            .join('')}
        </section>
      `
    })
    .join('')
}

export function renderStandings() {
  const sections = normalizeSections(state.standings)
  const diffs = gameDiffMap()
  const root = document.querySelector('#standings')
  if (!sections.length) {
    root.innerHTML = `<div class="empty">暂无积分榜</div>`
    return
  }

  root.innerHTML = sections
    .map((section) => {
      const rows = []
      for (const group of section.rankings || []) {
        for (const team of group.teams || []) {
          rows.push({ rank: group.ordinal, team })
        }
      }
      return `
        <section class="table">
          <h3>${escapeHtml(section.name)}</h3>
          <table>
            <thead>
              <tr><th>#</th><th>战队</th><th>胜负</th><th>净胜</th><th></th></tr>
            </thead>
            <tbody>
              ${rows
                .map(({ rank, team }) => {
                  const rec = team.record || {}
                  const diff = diffs.get(team.code)
                  const diffText = diff ? `${diff.gf - diff.ga > 0 ? '+' : ''}${diff.gf - diff.ga}` : '-'
                  const tag = promotionTag(section.name, rank, rows.length)
                  return `
                    <tr>
                      <td class="rank">${rank}</td>
                      <td>
                        <div class="rank-team">
                          <img src="${httpsUrl(team.image)}" alt="">
                          <div><b>${escapeHtml(team.code)}</b><small>${escapeHtml(teamLabel(team))}</small></div>
                        </div>
                      </td>
                      <td>${rec.wins ?? 0}-${rec.losses ?? 0}</td>
                      <td>${diffText}</td>
                      <td>${tag.text ? `<span class="tag ${tag.cls}">${tag.text}</span>` : ''}</td>
                    </tr>
                  `
                })
                .join('')}
            </tbody>
          </table>
        </section>
      `
    })
    .join('')
}

function hideBootScreen() {
  const el = document.querySelector('#boot-screen')
  if (!el || el.classList.contains('is-done')) return
  el.classList.add('is-done')
  el.addEventListener('transitionend', () => el.remove(), { once: true })
  window.setTimeout(() => el.remove(), 400)
}

export function renderAll() {
  renderClock()
  renderHero()
  renderFilters()
  renderSchedule()
  renderStandings()
  hideBootScreen()
}

function mergeLiveEvents(events, liveEvents) {
  const liveMap = new Map()
  for (const live of liveEvents || []) {
    const league = live.league?.slug || live.league?.name || ''
    if (league && league !== 'lpl' && league !== 'LPL') continue
    const id = live.match?.id || live.id
    if (id) liveMap.set(String(id), live)
  }
  state.liveIds = new Set(liveMap.keys())
  return (events || []).map((event) => {
    const live = liveMap.get(String(event.match?.id || ''))
    if (!live) return event
    return {
      ...event,
      state: live.state || 'inProgress',
      match: {
        ...event.match,
        ...live.match,
        teams: live.match?.teams?.length ? live.match.teams : event.match?.teams,
        strategy: live.match?.strategy || event.match?.strategy,
        games: live.match?.games || event.match?.games,
      },
    }
  })
}

function applyPayload(payload, source) {
  const split = currentSplit()
  const live = Array.isArray(payload.live)
    ? payload.live
    : payload.live?.data?.schedule?.events || []
  state.events = mergeLiveEvents(payload.events || [], live)
  const standingsWrap = payload.standings?.[split.tournamentId]
  state.standings = standingsWrap?.data?.standings || standingsWrap || payload.standings || []
  if (!Array.isArray(state.standings)) state.standings = state.standings.data?.standings || []
  state.fetchedAt = payload.fetchedAt || null
  state.source = source
}

export async function bootstrap({ silent = false, force = true } = {}) {
  if (!silent) renderSync('同步中…')
  const cache = readCache()
  if (cache?.events?.length) {
    applyPayload(cache, 'cache')
    renderAll()
    renderSync('已显示缓存，正在刷新…', 'stale')
  } else {
    const snapshot = await loadSnapshot()
    if (snapshot?.events?.length) {
      applyPayload(snapshot, 'snapshot')
      renderAll()
      renderSync('已显示本地快照，正在刷新…', 'stale')
    } else if (!silent) {
      document.querySelector('#schedule').innerHTML = `<div class="loading">正在加载赛程…</div>`
      hideBootScreen()
    }
  }

  try {
    const live = await loadLplData(currentSplit(), { force })
    applyPayload(live, 'live')
    renderAll()
    const t = live.fetchedAt ? new Date(live.fetchedAt) : new Date()
    renderSync(`已同步 ${t.toLocaleTimeString('zh-CN', { hour12: false })}`, 'ok')
  } catch (err) {
    console.error(err)
    if (!state.events.length) {
      const snapshot = await loadSnapshot()
      if (snapshot) {
        applyPayload(snapshot, 'snapshot')
        renderAll()
        renderSync('接口暂不可用，已显示本地快照', 'stale')
        return
      }
      document.querySelector('#schedule').innerHTML = `<div class="error">赛程加载失败，请稍后重试</div>`
      hideBootScreen()
    }
    renderSync('刷新失败，仍显示上次数据', 'err')
  }
}
