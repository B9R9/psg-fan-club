import axios from 'axios'
import { fetchFootmercatoMatch } from './footmercato.js'
import { storeMatchStats } from './footmercato.js'

const FLASHSCORE_RESULTS_PAGES = [
  'https://www.flashscore.com/football/france/ligue-1/results/',
  'https://www.flashscore.com/football/europe/champions-league/results/',
  'https://www.flashscore.com/football/france/coupe-de-france/results/'
]

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

export async function fetchMatchStats(homeTeam, awayTeam, matchDate) {
  const flashscoreData = await fetchFlashscoreMatch(homeTeam, awayTeam, matchDate)
  if (flashscoreData) return flashscoreData

  // Fallback in case Flashscore structure changes.
  return fetchFootmercatoMatch(homeTeam, awayTeam, matchDate)
}

export async function fetchFlashscoreMatch(homeTeam, awayTeam, matchDate) {
  try {
    const normalizedDate = normalizeDate(matchDate)
    const target = {
      home: normalizeTeamName(homeTeam),
      away: normalizeTeamName(awayTeam)
    }

    let bestMatch = null

    for (const pageUrl of FLASHSCORE_RESULTS_PAGES) {
      const pageHtml = await fetchHtml(pageUrl)
      const events = parseResultEvents(pageHtml)

      for (const event of events) {
        const score = scoreEventAgainstTarget(event, target, normalizedDate)
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { event, score }
        }
      }

      if (bestMatch && bestMatch.score >= 90) break
    }

    if (!bestMatch || bestMatch.score < 70) {
      console.warn(`No Flashscore match found for ${homeTeam} vs ${awayTeam} (${matchDate})`)
      return null
    }

    const eventId = bestMatch.event.id
    const matchUrl = `https://www.flashscore.com/match/${eventId}/`
    const matchHtml = await fetchHtml(matchUrl)
    const env = extractWindowEnvironment(matchHtml)

    if (!env) {
      console.warn(`Flashscore: no embedded environment for ${matchUrl}`)
      return null
    }

    const teams = parseTeamsFromEnvironment(env, homeTeam, awayTeam)
    const [statsPayload, lineupPayload] = await Promise.all([
      fetchDetailedStats(eventId),
      fetchLineupData(eventId)
    ])

    const formations = extractFormations(matchHtml, lineupPayload)
    const stats = extractDetailedStats(statsPayload, matchHtml)
    const { playerPerformances, lineups, events } = extractLineupDetails(lineupPayload)

    return {
      formations,
      stats,
      playerPerformances,
      lineups,
      events,
      source: 'flashscore',
      sourceUrl: matchUrl,
      eventId,
      teams,
      scrapedAt: new Date().toISOString()
    }
  } catch (err) {
    console.error('Flashscore scraping failed:', err.message)
    return null
  }
}

export async function storeScrapedMatchData(sb, matchId, scrapedData) {
  const statsStored = await storeMatchStats(sb, matchId, scrapedData)

  let lineupsStored = true
  if (Array.isArray(scrapedData?.lineups) && scrapedData.lineups.length) {
    lineupsStored = await replaceRows(sb, 'match_lineups', matchId, scrapedData.lineups)
  }

  let eventsStored = true
  if (Array.isArray(scrapedData?.events) && scrapedData.events.length) {
    eventsStored = await replaceMatchEvents(sb, matchId, scrapedData.events)
  }

  let playersSynced = true
  if (Array.isArray(scrapedData?.lineups) && scrapedData.lineups.length) {
    playersSynced = await syncPsgPlayersFromScrape(sb, scrapedData)
  }

  return {
    statsStored,
    lineupsStored,
    eventsStored,
    playersSynced,
    ok: statsStored && lineupsStored && eventsStored && playersSynced
  }
}

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    timeout: 20000,
    headers: BROWSER_HEADERS
  })
  return String(data)
}

async function fetchJson(url) {
  const { data } = await axios.get(url, {
    timeout: 20000,
    headers: BROWSER_HEADERS
  })
  return data
}

async function fetchDetailedStats(eventId) {
  return fetchJson(`https://2.ds.lsapp.eu/pq_graphql?_hash=dsos2&eventId=${eventId}&projectId=2`)
}

async function fetchLineupData(eventId) {
  return fetchJson(`https://2.ds.lsapp.eu/pq_graphql?_hash=dlie2&eventId=${eventId}&projectId=2`)
}

function parseResultEvents(html) {
  const events = []
  const regex = /(?:^|¬~)AA÷([A-Za-z0-9]+)([\s\S]*?)(?=¬~AA÷|¬~ZA÷|<\/script>|$)/g

  let match
  while ((match = regex.exec(html)) !== null) {
    const id = match[1]
    const block = match[2]

    const home = readBlockField(block, 'AE')
    const away = readBlockField(block, 'AF')
    const timestamp = Number(readBlockField(block, 'AD'))

    if (!id || !home || !away || !Number.isFinite(timestamp)) continue

    events.push({
      id,
      home,
      away,
      timestamp,
      date: new Date(timestamp * 1000).toISOString().slice(0, 10)
    })
  }

  return events
}

function readBlockField(block, key) {
  const match = block.match(new RegExp(`¬${key}÷([^¬]*)`))
  return match ? match[1].trim() : ''
}

function scoreEventAgainstTarget(event, target, targetDate) {
  const eventHome = normalizeTeamName(event.home)
  const eventAway = normalizeTeamName(event.away)

  const directMatch =
    fuzzyTeamMatch(target.home, eventHome) && fuzzyTeamMatch(target.away, eventAway)
  const inverseMatch =
    fuzzyTeamMatch(target.home, eventAway) && fuzzyTeamMatch(target.away, eventHome)

  if (!directMatch && !inverseMatch) return 0

  const dayDelta = Math.abs(dateToDays(event.date) - dateToDays(targetDate))

  let score = directMatch ? 70 : 60
  if (dayDelta === 0) score += 30
  else if (dayDelta === 1) score += 15
  else if (dayDelta > 2) score -= 25

  return score
}

function parseTeamsFromEnvironment(env, fallbackHome, fallbackAway) {
  const home = env?.participantsData?.home?.[0]?.name || fallbackHome
  const away = env?.participantsData?.away?.[0]?.name || fallbackAway
  return { home, away }
}

function extractFormations(html, lineupPayload) {
  const formations = {
    home: null,
    away: null,
    homeSystem: null,
    awaySystem: null
  }

  const participants = lineupPayload?.data?.findEventById?.eventParticipants || []
  const homeParticipant = participants.find((participant) => participant?.type?.side === 'HOME')
  const awayParticipant = participants.find((participant) => participant?.type?.side === 'AWAY')

  const homeFormation = homeParticipant?.lineup?.formation?.name || null
  const awayFormation = awayParticipant?.lineup?.formation?.name || null
  if (homeFormation) {
    formations.home = homeFormation
    formations.homeSystem = homeFormation
  }
  if (awayFormation) {
    formations.away = awayFormation
    formations.awaySystem = awayFormation
  }

  if (formations.home && formations.away) return formations

  const matches = [...new Set(html.match(/\b([1-5](?:-[1-5]){2,4})\b/g) || [])]
  const plausible = matches.filter((f) => {
    const sum = f.split('-').reduce((acc, x) => acc + Number(x), 0)
    return sum >= 9 && sum <= 11
  })

  if (plausible.length >= 1) {
    formations.home = plausible[0]
    formations.homeSystem = plausible[0]
  }
  if (plausible.length >= 2) {
    formations.away = plausible[1]
    formations.awaySystem = plausible[1]
  }

  return formations
}

function extractDetailedStats(statsPayload, html) {
  const baseStats = extractBasicStats(html)
  const participants = statsPayload?.data?.findEventById?.eventParticipants || []

  for (const participant of participants) {
    const side = participant?.type?.side === 'HOME' ? 'home' : participant?.type?.side === 'AWAY' ? 'away' : null
    if (!side) continue

    const values = participant.stats?.flatMap((entry) => entry?.values || []) || []
    for (const value of values) {
      const mappedKey = FLASH_SCORE_STAT_MAP[value?.type] || statTypeToKey(value?.type)
      if (!mappedKey) continue
      baseStats[side][mappedKey] = parseStatValue(value.value)
    }
  }

  return baseStats
}

function extractBasicStats(html) {
  const title = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] || ''
  const scoreMatch = title.match(/(\d+)\s*[:\-]\s*(\d+)/)

  const homeGoals = scoreMatch ? Number(scoreMatch[1]) : null
  const awayGoals = scoreMatch ? Number(scoreMatch[2]) : null

  return {
    home: {
      possession: null,
      shots: null,
      shotsOnTarget: null,
      passes: null,
      passAccuracy: null,
      fouls: null,
      corners: null,
      offsides: null,
      yellowCards: null,
      redCards: null,
      expectedGoals: null,
      bigChances: null,
      touchesInOppositionBox: null,
      goals: Number.isFinite(homeGoals) ? homeGoals : null
    },
    away: {
      possession: null,
      shots: null,
      shotsOnTarget: null,
      passes: null,
      passAccuracy: null,
      fouls: null,
      corners: null,
      offsides: null,
      yellowCards: null,
      redCards: null,
      expectedGoals: null,
      bigChances: null,
      touchesInOppositionBox: null,
      goals: Number.isFinite(awayGoals) ? awayGoals : null
    }
  }
}

function extractLineupDetails(lineupPayload) {
  const participants = lineupPayload?.data?.findEventById?.eventParticipants || []
  const playerPerformances = { home: [], away: [] }
  const lineups = []
  const events = []
  const eventKeys = new Set()

  for (const participant of participants) {
    const side = participant?.type?.side === 'HOME' ? 'home' : participant?.type?.side === 'AWAY' ? 'away' : null
    if (!side || !participant.lineup) continue

    const starters = new Set(
      participant.lineup.groups?.find((group) => group.name === 'Starting Lineups')?.playerIds || []
    )
    const substitutes = participant.lineup.groups?.find((group) => group.name === 'Substitutes')?.playerIds || []
    const benchOrderById = new Map(substitutes.map((id, index) => [id, index + 1]))
    const positionMap = buildFormationPositionMap(participant.lineup)

    for (const player of participant.lineup.players || []) {
      const playerName = player.listName || player.fieldName || player.participant?.name || 'Unknown'
      const mappedPosition = positionMap.get(player.id) || null
      const broadPosition = inferBroadPosition(player, starters.has(player.id), mappedPosition)
      const positionDetail = inferPositionDetail(player, mappedPosition)

      lineups.push({
        match_id: null,
        team: side,
        player_name: playerName,
        shirt_number: parseNullableInt(player.number),
        position: broadPosition,
        position_detail: positionDetail,
        is_starter: starters.has(player.id),
        bench_order: benchOrderById.get(player.id) || null
      })

      playerPerformances[side].push({
        name: playerName,
        position: positionDetail || broadPosition,
        rating: parseNullableFloat(player.rating?.value),
        minutesPlayed: inferMinutesPlayed(player, starters.has(player.id)),
        shirtNumber: parseNullableInt(player.number),
        status: starters.has(player.id) ? 'starter' : 'sub'
      })

      for (const incident of player.incidents || []) {
        const mappedEvents = mapIncidentToEvents(incident, side, player, participant.lineup.players)
        for (const event of mappedEvents) {
          const key = `${event.team}:${event.minute}:${event.event_type}:${event.player_name}:${event.related_player_name || ''}`
          if (eventKeys.has(key)) continue
          eventKeys.add(key)
          events.push(event)
        }
      }
    }
  }

  events.sort((a, b) => {
    const aMinute = a.minute + (a.extra_minute || 0) / 100
    const bMinute = b.minute + (b.extra_minute || 0) / 100
    return aMinute - bMinute
  })

  return { playerPerformances, lineups, events }
}

async function replaceMatchEvents(sb, matchId, rows) {
  try {
    const { error: deleteError } = await sb.from('match_events').delete().eq('match_id', matchId)
    if (deleteError) {
      console.error('Error clearing match_events:', deleteError)
      return false
    }

    if (!rows.length) return true

    const goals = rows.filter((row) => row.event_type !== 'assist')
    const assists = rows.filter((row) => row.event_type === 'assist')

    const { data: insertedGoals, error: goalsError } = await sb
      .from('match_events')
      .insert(goals.map((row) => ({ ...row, match_id: matchId })))
      .select('id, minute, extra_minute, event_type, team, player_name, related_player_name')

    if (goalsError) {
      console.error('Error inserting match_events:', goalsError)
      return false
    }

    if (assists.length) {
      const assistRows = assists.map((row) => ({
        ...row,
        match_id: matchId,
        linked_event_id: resolveLinkedGoalId(row, insertedGoals || [])
      }))

      const { error: assistError } = await sb.from('match_events').insert(assistRows)
      if (assistError) {
        console.error('Error inserting assist match_events:', assistError)
        return false
      }
    }

    return true
  } catch (err) {
    console.error('Error replacing match_events:', err)
    return false
  }
}

function resolveLinkedGoalId(assistEvent, insertedGoals) {
  const exact = insertedGoals.find((goal) =>
    goal.event_type === 'goal' &&
    goal.team === assistEvent.team &&
    goal.minute === assistEvent.minute &&
    normalizeExtraMinute(goal.extra_minute) === normalizeExtraMinute(assistEvent.extra_minute)
  )
  if (exact) return exact.id

  const nearby = insertedGoals.find((goal) =>
    goal.event_type === 'goal' &&
    goal.team === assistEvent.team &&
    Math.abs(goal.minute - assistEvent.minute) <= 1
  )

  return nearby?.id || null
}

async function replaceRows(sb, table, matchId, rows) {
  try {
    const { error: deleteError } = await sb.from(table).delete().eq('match_id', matchId)
    if (deleteError) {
      console.error(`Error clearing ${table}:`, deleteError)
      return false
    }

    if (!rows.length) return true

    const payload = rows.map((row) => ({ ...row, match_id: matchId }))
    const { error: insertError } = await sb.from(table).insert(payload)
    if (insertError) {
      console.error(`Error inserting ${table}:`, insertError)
      return false
    }

    return true
  } catch (err) {
    console.error(`Error replacing ${table}:`, err)
    return false
  }
}

async function syncPsgPlayersFromScrape(sb, scrapedData) {
  try {
    const psgSide = resolvePsgSide(scrapedData?.teams)
    if (!psgSide) return true

    const psgLineups = (scrapedData?.lineups || [])
      .filter((row) => row?.team === psgSide && row?.player_name)
      .map((row) => ({
        name: cleanPlayerName(row.player_name),
        number: parseNullableInt(row.shirt_number),
        position: normalizePlayerPosition(row.position),
        positionDetail: row.position_detail || null
      }))
      .filter((row) => row.name)

    if (!psgLineups.length) return true

    const byName = new Map()
    for (const row of psgLineups) {
      if (!byName.has(row.name)) byName.set(row.name, row)
    }

    const players = [...byName.values()]
    const names = players.map((row) => row.name)

    const { data: existingPlayers, error: existingError } = await sb
      .from('players')
      .select('id, name, number, position, position_detail, is_active, display_order')

    if (existingError) {
      console.error('Error loading existing PSG players:', existingError)
      return false
    }

    const existingByKey = new Map()
    for (const row of existingPlayers || []) {
      const key = normalizePlayerKey(row.name)
      if (!key) continue
      const previous = existingByKey.get(key)
      if (!previous || isPreferredExistingPlayer(row, previous)) {
        existingByKey.set(key, row)
      }
    }
    const toInsert = []

    for (const player of players) {
      const key = normalizePlayerKey(player.name)
      const existing = existingByKey.get(key)

      if (!existing) {
        toInsert.push({
          name: player.name,
          club: 'MATCH_PLAYER',
          number: player.number,
          position: player.position || 'MID',
          position_detail: player.positionDetail,
          is_active: false,
          display_order: 999
        })
        continue
      }

      const patch = {}
      if (player.number != null && existing.number !== player.number) patch.number = player.number
      if (player.position && existing.position !== player.position) patch.position = player.position
      if (player.positionDetail && existing.position_detail !== player.positionDetail) {
        patch.position_detail = player.positionDetail
      }

      if (Object.keys(patch).length) {
        const { error: updateError } = await sb.from('players').update(patch).eq('id', existing.id)
        if (updateError) {
          console.error(`Error updating player ${existing.name}:`, updateError)
          return false
        }
      }
    }

    if (toInsert.length) {
      const { error: insertError } = await sb.from('players').insert(toInsert)
      if (insertError) {
        console.error('Error inserting PSG players from lineup:', insertError)
        return false
      }
    }

    return recomputePsgPlayersTotals(sb)
  } catch (err) {
    console.error('Error syncing PSG players from scrape:', err)
    return false
  }
}

function isPreferredExistingPlayer(candidate, current) {
  const candidateAuto = Number(candidate?.display_order) === 999
  const currentAuto = Number(current?.display_order) === 999
  if (candidateAuto !== currentAuto) return !candidateAuto
  return Number(candidate?.id || 0) < Number(current?.id || 0)
}

async function recomputePsgPlayersTotals(sb) {
  const { data: playedMatches, error: matchesError } = await sb
    .from('matches')
    .select('id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
    .eq('status', 'played')

  if (matchesError) {
    console.error('Error loading played matches for player totals:', matchesError)
    return false
  }

  const psgSideByMatch = new Map()
  for (const match of playedMatches || []) {
    if (isPsgTeamName(match?.home_team?.name)) {
      psgSideByMatch.set(match.id, 'home')
    } else if (isPsgTeamName(match?.away_team?.name)) {
      psgSideByMatch.set(match.id, 'away')
    }
  }

  const matchIds = [...psgSideByMatch.keys()]
  if (!matchIds.length) return true

  const [{ data: lineupRows, error: lineupsError }, { data: eventRows, error: eventsError }] = await Promise.all([
    sb.from('match_lineups').select('match_id, team, player_name').in('match_id', matchIds),
    sb.from('match_events').select('match_id, team, event_type, player_name').in('match_id', matchIds)
  ])

  if (lineupsError) {
    console.error('Error loading match_lineups for totals:', lineupsError)
    return false
  }
  if (eventsError) {
    console.error('Error loading match_events for totals:', eventsError)
    return false
  }

  const appearancesByPlayer = new Map()
  for (const row of lineupRows || []) {
    const psgSide = psgSideByMatch.get(row.match_id)
    if (!psgSide || row.team !== psgSide || !row.player_name) continue
    const name = cleanPlayerName(row.player_name)
    if (!name) continue
    if (!appearancesByPlayer.has(name)) appearancesByPlayer.set(name, new Set())
    appearancesByPlayer.get(name).add(row.match_id)
  }

  const goalsByPlayer = new Map()
  const assistsByPlayer = new Map()
  for (const row of eventRows || []) {
    const psgSide = psgSideByMatch.get(row.match_id)
    if (!psgSide || row.team !== psgSide || !row.player_name) continue
    const name = cleanPlayerName(row.player_name)
    if (!name) continue

    if (row.event_type === 'goal' || row.event_type === 'penalty_goal') {
      goalsByPlayer.set(name, (goalsByPlayer.get(name) || 0) + 1)
    }
    if (row.event_type === 'assist') {
      assistsByPlayer.set(name, (assistsByPlayer.get(name) || 0) + 1)
    }
  }

  const involvedPlayers = new Set([
    ...appearancesByPlayer.keys(),
    ...goalsByPlayer.keys(),
    ...assistsByPlayer.keys()
  ])
  if (!involvedPlayers.size) return true

  const playerNames = [...involvedPlayers]
  const { data: dbPlayers, error: playersError } = await sb
    .from('players')
    .select('id, name, appearances_total, goals_total, assists_total')
    .in('name', playerNames)

  if (playersError) {
    console.error('Error loading players for total updates:', playersError)
    return false
  }

  for (const player of dbPlayers || []) {
    const name = cleanPlayerName(player.name)
    const nextAppearances = appearancesByPlayer.has(name) ? appearancesByPlayer.get(name).size : 0
    const nextGoals = goalsByPlayer.get(name) || 0
    const nextAssists = assistsByPlayer.get(name) || 0

    if (
      Number(player.appearances_total || 0) === nextAppearances &&
      Number(player.goals_total || 0) === nextGoals &&
      Number(player.assists_total || 0) === nextAssists
    ) {
      continue
    }

    const { error: updateError } = await sb
      .from('players')
      .update({
        appearances_total: nextAppearances,
        goals_total: nextGoals,
        assists_total: nextAssists
      })
      .eq('id', player.id)

    if (updateError) {
      console.error(`Error updating player totals for ${player.name}:`, updateError)
      return false
    }
  }

  const merged = await mergeDuplicateAutoPlayers(sb)
  if (!merged) return false

  const pruned = await pruneAutoPlayersOutsidePsgLineups(sb, involvedPlayers)
  if (!pruned) return false

  return true
}

async function mergeDuplicateAutoPlayers(sb) {
  try {
    const { data: autoPlayers, error: autoPlayersError } = await sb
      .from('players')
      .select('id, name, display_order, appearances_total, goals_total, assists_total')
      .eq('display_order', 999)

    if (autoPlayersError) {
      console.error('Error loading auto-generated players for dedupe:', autoPlayersError)
      return false
    }

    const groups = new Map()
    for (const player of autoPlayers || []) {
      const key = normalizePlayerKey(player.name)
      if (!key) continue
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(player)
    }

    const toDelete = []
    for (const [, group] of groups) {
      if (group.length <= 1) continue

      const sorted = [...group].sort((a, b) => {
        const scoreA = Number(a.appearances_total || 0) * 1000 + Number(a.goals_total || 0) * 10 + Number(a.assists_total || 0)
        const scoreB = Number(b.appearances_total || 0) * 1000 + Number(b.goals_total || 0) * 10 + Number(b.assists_total || 0)
        if (scoreA !== scoreB) return scoreB - scoreA

        const hasDotA = String(a.name || '').includes('.') ? 0 : 1
        const hasDotB = String(b.name || '').includes('.') ? 0 : 1
        if (hasDotA !== hasDotB) return hasDotB - hasDotA

        return Number(a.id || 0) - Number(b.id || 0)
      })

      const keep = sorted[0]
      for (const row of sorted.slice(1)) {
        if (row.id !== keep.id) toDelete.push(row.id)
      }
    }

    if (!toDelete.length) return true

    const { error: deleteError } = await sb.from('players').delete().in('id', toDelete)
    if (deleteError) {
      console.error('Error deleting duplicate auto players:', deleteError)
      return false
    }

    return true
  } catch (err) {
    console.error('Error merging duplicate auto players:', err)
    return false
  }
}

async function pruneAutoPlayersOutsidePsgLineups(sb, validPlayerNames) {
  try {
    const validKeys = new Set([...validPlayerNames].map((name) => normalizePlayerKey(name)))

    const { data: autoPlayers, error: autoPlayersError } = await sb
      .from('players')
      .select('id, name, display_order')
      .eq('display_order', 999)

    if (autoPlayersError) {
      console.error('Error loading auto-generated players for cleanup:', autoPlayersError)
      return false
    }

    const toDelete = (autoPlayers || [])
      .filter((player) => !validKeys.has(normalizePlayerKey(player.name)))
      .map((player) => player.id)

    if (!toDelete.length) return true

    const { error: deleteError } = await sb.from('players').delete().in('id', toDelete)
    if (deleteError) {
      console.error('Error deleting non-PSG auto players:', deleteError)
      return false
    }

    return true
  } catch (err) {
    console.error('Error pruning non-PSG auto players:', err)
    return false
  }
}

function mapIncidentToEvents(incidentWrapper, side, player, allPlayers) {
  const incidentType = incidentWrapper?.__typename || ''
  const incident = incidentWrapper?.incident || {}
  const minute = parseMinute(incident.minute)
  if (!minute) return []

  const playerName = player.listName || player.fieldName || player.participant?.name || 'Unknown'
  const relatedPlayer =
    findPlayerById(allPlayers, incidentWrapper.playerOutId || incidentWrapper.playerInId)

  if (incidentType === 'EventIncidentGoal') {
    return [{
      minute: minute.minute,
      extra_minute: minute.extraMinute,
      period: 'regular',
      event_type: 'goal',
      team: side,
      player_name: playerName,
      related_player_name: null,
      notes: null
    }]
  }

  if (incidentType === 'EventIncidentAssistance') {
    return [{
      minute: minute.minute,
      extra_minute: minute.extraMinute,
      period: 'regular',
      event_type: 'assist',
      team: side,
      player_name: playerName,
      related_player_name: null,
      notes: null
    }]
  }

  if (incidentType === 'EventIncidentSubstitutionIn') {
    return [{
      minute: minute.minute,
      extra_minute: minute.extraMinute,
      period: 'regular',
      event_type: 'sub_in',
      team: side,
      player_name: playerName,
      related_player_name: relatedPlayer,
      notes: incident.reasons?.join(', ') || null
    }]
  }

  if (incidentType === 'EventIncidentSubstitutionOut') {
    return [{
      minute: minute.minute,
      extra_minute: minute.extraMinute,
      period: 'regular',
      event_type: 'sub_out',
      team: side,
      player_name: playerName,
      related_player_name: relatedPlayer,
      notes: incident.reasons?.join(', ') || null
    }]
  }

  if (incidentType === 'EventIncidentYellowCard') {
    return [{
      minute: minute.minute,
      extra_minute: minute.extraMinute,
      period: 'regular',
      event_type: 'yellow_card',
      team: side,
      player_name: playerName,
      related_player_name: null,
      notes: incident.reasons?.join(', ') || null
    }]
  }

  if (incidentType === 'EventIncidentRedCard' || incidentType === 'EventIncidentYellowRedCard') {
    return [{
      minute: minute.minute,
      extra_minute: minute.extraMinute,
      period: 'regular',
      event_type: incidentType === 'EventIncidentYellowRedCard' ? 'second_yellow' : 'red_card',
      team: side,
      player_name: playerName,
      related_player_name: null,
      notes: incident.reasons?.join(', ') || null
    }]
  }

  return []
}

function inferBroadPosition(player, isStarter, mappedPosition) {
  if (mappedPosition) return POSITION_GROUPS[mappedPosition] || null
  const roleTitles = (player.playerRoles || []).map((role) => String(role.title || '').toLowerCase())
  if (roleTitles.some((role) => role.includes('goalkeeper'))) return 'GK'
  if (!isStarter) return null
  return null
}

function inferPositionDetail(player, mappedPosition) {
  if (mappedPosition) return mappedPosition
  const role = player.playerRoles?.[0]
  if (role?.suffix === '(G)' || /goalkeeper/i.test(role?.title || '')) return 'GK'
  return null
}

function inferMinutesPlayed(player, isStarter) {
  const substitutionOut = (player.incidents || []).find((incident) => incident.__typename === 'EventIncidentSubstitutionOut')
  const substitutionIn = (player.incidents || []).find((incident) => incident.__typename === 'EventIncidentSubstitutionIn')
  const outMinute = parseMinute(substitutionOut?.incident?.minute)
  const inMinute = parseMinute(substitutionIn?.incident?.minute)

  if (isStarter && outMinute) return outMinute.minute
  if (isStarter) return 90
  if (inMinute) return Math.max(0, 90 - inMinute.minute + 1)
  return null
}

function findPlayerById(players, playerId) {
  if (!playerId) return null
  const player = (players || []).find((item) => item.id === playerId)
  return player?.listName || player?.fieldName || player?.participant?.name || null
}

function parseMinute(value) {
  if (!value) return null
  const match = String(value).match(/(\d+)(?:\+(\d+))?/) 
  if (!match) return null
  return {
    minute: Number(match[1]),
    extraMinute: match[2] ? Number(match[2]) : null
  }
}

function parseNullableInt(value) {
  if (value == null || value === '') return null
  const parsed = Number.parseInt(String(value), 10)
  return Number.isNaN(parsed) ? null : parsed
}

function parseNullableFloat(value) {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? null : parsed
}

function parseStatValue(value) {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? null : parsed
}

function statTypeToKey(type) {
  const raw = String(type || '').trim()
  if (!raw) return null
  return raw.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}

function normalizeExtraMinute(value) {
  return value == null ? null : Number(value)
}

function resolvePsgSide(teams) {
  if (isPsgTeamName(teams?.home)) return 'home'
  if (isPsgTeamName(teams?.away)) return 'away'
  return null
}

function isPsgTeamName(name) {
  const raw = String(name || '').toLowerCase().trim()
  if (!raw) return false
  if (raw.includes('paris saint-germain') || raw.includes('paris saint germain')) return true
  if (raw === 'psg' || raw.startsWith('psg ')) return true

  const normalized = normalizeTeamName(name)
  return normalized === 'paris sg' || normalized.startsWith('paris sg ')
}

function normalizePlayerKey(name) {
  return normalizeNameForLookup(cleanPlayerName(name))
}

function cleanPlayerName(name) {
  const raw = String(name || '').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  const mapped = PSG_PLAYER_NAME_CANONICAL_MAP[normalizeNameForLookup(raw)]
  return mapped || raw
}

function normalizePlayerPosition(position) {
  if (!position) return 'MID'
  const normalized = String(position).toUpperCase()
  return normalized === 'GK' || normalized === 'DEF' || normalized === 'MID' || normalized === 'FWD'
    ? normalized
    : 'MID'
}

function normalizeNameForLookup(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildFormationPositionMap(lineup) {
  const map = new Map()
  const rows = lineup?.formation?.lines?.flatMap((line) => line.rows || []) || []
  if (!rows.length) return map

  const outfieldRows = rows.slice(1)
  for (const row of rows) {
    const playerIds = row.playerIds || []
    let labels = []

    if (row.sortKey === 0) {
      labels = ['GK']
    } else {
      const rowIndex = outfieldRows.findIndex((candidate) => candidate.sortKey === row.sortKey)
      const rowType = classifyFormationRow(rowIndex, outfieldRows.length)
      labels = positionLabelsForRow(rowType, playerIds.length)
    }

    for (const [index, playerId] of playerIds.entries()) {
      map.set(playerId, labels[index] || fallbackPositionForRow(labels[0]))
    }
  }

  return map
}

function classifyFormationRow(rowIndex, outfieldRowCount) {
  if (rowIndex <= 0) return 'def'
  if (outfieldRowCount === 2) return rowIndex === 1 ? 'fwd' : 'def'
  if (outfieldRowCount === 3) return rowIndex === 1 ? 'mid' : rowIndex === 2 ? 'fwd' : 'def'
  if (outfieldRowCount === 4) {
    if (rowIndex === 1) return 'mid-def'
    if (rowIndex === 2) return 'mid-att'
    if (rowIndex === 3) return 'fwd'
    return 'def'
  }
  if (outfieldRowCount >= 5) {
    if (rowIndex === outfieldRowCount - 1) return 'fwd'
    if (rowIndex === outfieldRowCount - 2) return 'mid-att'
    if (rowIndex === 1) return 'mid-def'
    return 'mid'
  }
  return 'mid'
}

function positionLabelsForRow(rowType, count) {
  if (rowType === 'def') {
    if (count === 2) return ['LB', 'RB']
    if (count === 3) return ['LCB', 'CB', 'RCB']
    if (count === 4) return ['LB', 'LCB', 'RCB', 'RB']
    if (count === 5) return ['LWB', 'LCB', 'CB', 'RCB', 'RWB']
  }

  if (rowType === 'mid-def') {
    if (count === 1) return ['CDM']
    if (count === 2) return ['CDM', 'CDM']
    if (count === 3) return ['LDM', 'CDM', 'RDM']
  }

  if (rowType === 'mid') {
    if (count === 2) return ['CM', 'CM']
    if (count === 3) return ['LCM', 'CM', 'RCM']
    if (count === 4) return ['LM', 'LCM', 'RCM', 'RM']
    if (count === 5) return ['LM', 'LCM', 'CM', 'RCM', 'RM']
  }

  if (rowType === 'mid-att') {
    if (count === 1) return ['CAM']
    if (count === 2) return ['CAM', 'CAM']
    if (count === 3) return ['LW', 'CAM', 'RW']
    if (count === 4) return ['LM', 'CAM', 'CAM', 'RM']
  }

  if (rowType === 'fwd') {
    if (count === 1) return ['ST']
    if (count === 2) return ['CF', 'ST']
    if (count === 3) return ['LW', 'ST', 'RW']
  }

  return Array.from({ length: count }, () => fallbackPositionForRow(rowType))
}

function fallbackPositionForRow(rowType) {
  if (rowType === 'def') return 'CB'
  if (rowType === 'mid-def') return 'CDM'
  if (rowType === 'mid-att') return 'CAM'
  if (rowType === 'fwd') return 'ST'
  return 'CM'
}

const FLASH_SCORE_STAT_MAP = {
  expected_goals: 'expectedGoals',
  ball_possession: 'possession',
  goal_attempts: 'shots',
  shots_on_target: 'shotsOnTarget',
  shots_off_target: 'shotsOffTarget',
  blocked_shots: 'blockedShots',
  big_chances: 'bigChances',
  big_chances_missed: 'bigChancesMissed',
  touches_in_opposition_box: 'touchesInOppositionBox',
  total_passes: 'passes',
  accurate_passes: 'accuratePasses',
  pass_success_percentage: 'passAccuracy',
  fouls: 'fouls',
  offsides: 'offsides',
  corner_kicks: 'corners',
  throw_ins: 'throwIns',
  free_kicks: 'freeKicks',
  yellow_cards: 'yellowCards',
  red_cards: 'redCards',
  goalkeeper_saves: 'saves',
  tackles: 'tackles',
  interceptions: 'interceptions',
  clearances: 'clearances'
}

const PSG_PLAYER_NAME_CANONICAL_MAP = {
  'hakimi a': 'Achraf Hakimi',
  'barcola b': 'Bradley Barcola',
  'dembele o': 'Ousmane Dembele',
  'doue d': 'Desire Doue',
  'kvaratskhelia k': 'Khvicha Kvaratskhelia',
  'lee kang in': 'Lee Kang-in',
  'mendes n': 'Nuno Mendes',
  'neves j': 'Joao Neves',
  'pacho w': 'Willian Pacho',
  'ramos g': 'Goncalo Ramos',
  'ruiz f': 'Fabian Ruiz',
  'safonov m': 'Matvey Safonov',
  'zaire emery w': 'Warren Zaire-Emery',
  'beraldo l': 'Lucas Beraldo'
}

const POSITION_GROUPS = {
  GK: 'GK',
  LB: 'DEF',
  LCB: 'DEF',
  CB: 'DEF',
  RCB: 'DEF',
  RB: 'DEF',
  LWB: 'DEF',
  RWB: 'DEF',
  LDM: 'MID',
  CDM: 'MID',
  RDM: 'MID',
  LCM: 'MID',
  CM: 'MID',
  RCM: 'MID',
  LM: 'MID',
  RM: 'MID',
  CAM: 'MID',
  LW: 'FWD',
  RW: 'FWD',
  CF: 'FWD',
  ST: 'FWD'
}

function normalizeDate(dateLike) {
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return String(dateLike).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function dateToDays(dateLike) {
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return 0
  return Math.floor(d.getTime() / 86400000)
}

function normalizeTeamName(name) {
  if (!name) return ''
  let normalized = String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/saint-germain/g, 'sg')
    .replace(/munchen|münchen/g, 'munich')
    .replace(/stade brestois 29/g, 'brest')
    .replace(/\bbayern munich\b/g, 'bayern')
    .replace(/\bbayern munchen\b/g, 'bayern')
    .replace(/\bparis saint germain\b/g, 'paris sg')
    .replace(/\bparis-saint-germain\b/g, 'paris sg')
    .replace(/\bpsg\b/g, 'paris sg')
    .replace(/\bfootball club\b|\bfc\b|\bsc\b|\bac\b|\bclub\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
}

function fuzzyTeamMatch(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true

  const aTokens = new Set(a.split(' ').filter(Boolean))
  const bTokens = new Set(b.split(' ').filter(Boolean))

  let overlap = 0
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap++
  }

  const ratio = overlap / Math.max(1, Math.min(aTokens.size, bTokens.size))
  return ratio >= 0.5
}

function extractWindowEnvironment(html) {
  const marker = 'window.environment = '
  const start = html.indexOf(marker)
  if (start < 0) return null

  let i = start + marker.length
  while (i < html.length && html[i] !== '{') i++
  if (i >= html.length) return null

  const begin = i
  let depth = 0
  let inString = false
  let escaped = false

  for (; i < html.length; i++) {
    const ch = html[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        const raw = html.slice(begin, i + 1)
        try {
          return JSON.parse(raw)
        } catch {
          return null
        }
      }
    }
  }

  return null
}
