export const GPR_PAGE_URL = 'https://lolesports.com/en-GB/gpr/2026/current'
export const GPR_SOURCE_LABEL = 'LoL Esports Global Power Rankings'

function httpsUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  if (raw.startsWith('//')) return `https:${raw}`
  return raw.replace(/^http:\/\//i, 'https://')
}

export function parseGprHtml(html) {
  const text = String(html || '')
  const teamsByCode = new Map()
  const teamRe =
    /"currentTeamGPR":\{"__typename":"GPR","dateCalculated":"([^"]+)","elo":(\d+),"gprScore":(\d+),"rank":(\d+)\}/g

  let match
  while ((match = teamRe.exec(text))) {
    const from = Math.max(0, match.index - 500)
    const window = text.slice(from, match.index + 2400)
    const teamMatch = window.match(
      /"team":\{"__typename":"Team","code":"([^"]+)","homeLeague":\{"__typename":"HomeLeague","id":"([^"]+)","image":"([^"]*)","name":"([^"]+)","slug":"([^"]+)"\},"id":"([^"]+)","image":"([^"]*)","name":"([^"]+)","slug":"([^"]+)"\}/,
    )
    if (!teamMatch) continue

    const prevMatch = window.match(
      /"previousTeamGPR":\{"__typename":"GPR","dateCalculated":"([^"]+)","elo":(\d+),"gprScore":(\d+),"rank":(\d+)\}/,
    )
    const recordMatch = window.match(
      /"teamMatchRecord":\{"__typename":"TeamRecord","wins":(\d+),"losses":(\d+)\}/,
    )

    const code = teamMatch[1]
    const rank = Number(match[4])
    const existing = teamsByCode.get(code)
    if (existing && existing.rank <= rank) continue

    teamsByCode.set(code, {
      code,
      name: teamMatch[8],
      slug: teamMatch[9],
      image: httpsUrl(teamMatch[7]),
      leagueId: teamMatch[2],
      league: teamMatch[4],
      leagueSlug: teamMatch[5],
      leagueImage: httpsUrl(teamMatch[3]),
      rank,
      gpr: Number(match[3]),
      elo: Number(match[2]),
      dateCalculated: match[1],
      prevRank: prevMatch ? Number(prevMatch[4]) : null,
      prevGpr: prevMatch ? Number(prevMatch[3]) : null,
      wins: recordMatch ? Number(recordMatch[1]) : null,
      losses: recordMatch ? Number(recordMatch[2]) : null,
    })
  }

  const leaguesBySlug = new Map()
  const leagueRe =
    /"__typename":"LeagueELO","id":"[^"]+","leagueElo":(\d+),"dateCalculated":"([^"]+)","league":\{"__typename":"League","id":"([^"]+)","image":"([^"]*)","name":"([^"]+)","slug":"([^"]+)"\}/g
  while ((match = leagueRe.exec(text))) {
    const slug = match[6]
    leaguesBySlug.set(slug, {
      elo: Number(match[1]),
      dateCalculated: match[2],
      id: match[3],
      image: httpsUrl(match[4]),
      name: match[5],
      slug,
    })
  }

  const teams = [...teamsByCode.values()].sort((a, b) => a.rank - b.rank || b.gpr - a.gpr)
  const leagues = [...leaguesBySlug.values()].sort((a, b) => b.elo - a.elo)
  const updatedAt = teams[0]?.dateCalculated || leagues[0]?.dateCalculated || null

  return { teams, leagues, updatedAt, source: GPR_PAGE_URL }
}

export async function fetchOfficialGprHtml() {
  const res = await fetch(GPR_PAGE_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'Mozilla/5.0 (compatible; lol-tournament-schedule/1.0)',
    },
  })
  if (!res.ok) throw new Error(`gpr page ${res.status}`)
  return res.text()
}

export async function loadOfficialGpr() {
  const html = await fetchOfficialGprHtml()
  const data = parseGprHtml(html)
  if (!data.teams.length) throw new Error('gpr parse empty')
  return data
}
