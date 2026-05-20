import axios from 'axios'
import * as cheerio from 'cheerio'

/**
 * Scrape match statistics from Footmercato
 * Returns: { formation, stats, playerPerformances }
 */
export async function fetchFootmercatoMatch(homeTeam, awayTeam, matchDate) {
  try {
    // Build search query
    const query = `${homeTeam} vs ${awayTeam} ${matchDate}`.replace(/\s+/g, '-').toLowerCase()
    const url = `https://www.footmercato.net/recherche?q=${encodeURIComponent(query)}`

    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const $ = cheerio.load(data)
    
    // Look for match result link
    const matchLink = $('a.result-match').first().attr('href')
    if (!matchLink) {
      console.warn(`No match found on Footmercato for ${homeTeam} vs ${awayTeam}`)
      return null
    }

    // Fetch match details page
    const matchUrl = matchLink.startsWith('http') ? matchLink : `https://www.footmercato.net${matchLink}`
    const { data: matchPage } = await axios.get(matchUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const $$ = cheerio.load(matchPage)

    // Extract formations
    const formations = extractFormations($$)
    
    // Extract match statistics
    const stats = extractStats($$)
    
    // Extract player performances
    const playerPerformances = extractPlayerPerformances($$)

    return {
      formations,
      stats,
      playerPerformances,
      scrapedAt: new Date().toISOString()
    }
  } catch (err) {
    console.error('Footmercato scraping failed:', err.message)
    return null
  }
}

function extractFormations($) {
  const formations = {
    home: null,
    away: null,
    homeSystem: null,
    awaySystem: null
  }

  // Look for formation patterns like "4-3-3", "3-5-2", etc.
  const formationPattern = /(\d+)-(\d+)-(\d+)/g
  const pageText = $('body').text()
  const matches = pageText.match(formationPattern)
  
  if (matches && matches.length >= 2) {
    formations.home = matches[0]
    formations.away = matches[1]
  }

  // Try to extract tactical systems from team sheets
  const homeTeamSheets = $('.team-composition, .team-sheet').eq(0)
  const awayTeamSheets = $('.team-composition, .team-sheet').eq(1)

  formations.homeSystem = homeTeamSheets.find('.system, [data-system]').text().trim() || formations.home
  formations.awaySystem = awayTeamSheets.find('.system, [data-system]').text().trim() || formations.away

  return formations
}

function extractStats($) {
  const stats = {
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
      redCards: null
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
      redCards: null
    }
  }

  // Look for statistics table
  const statRows = $('.match-stats tr, [data-stat-row]')
  
  statRows.each((idx, row) => {
    const $row = $(row)
    const stat = $row.find('td, div').eq(0).text().trim().toLowerCase()
    const homeVal = $row.find('td, div').eq(1).text().trim()
    const awayVal = $row.find('td, div').eq(2).text().trim()

    if (stat.includes('possession')) {
      stats.home.possession = parseNumber(homeVal)
      stats.away.possession = parseNumber(awayVal)
    } else if (stat.includes('tir') || stat.includes('shot')) {
      const homeStat = parseNumber(homeVal)
      if (homeStat !== null) stats.home.shots = homeStat
      const awayStat = parseNumber(awayVal)
      if (awayStat !== null) stats.away.shots = awayStat
    } else if (stat.includes('encadré') || stat.includes('on target')) {
      stats.home.shotsOnTarget = parseNumber(homeVal)
      stats.away.shotsOnTarget = parseNumber(awayVal)
    } else if (stat.includes('passe') || stat.includes('pass')) {
      stats.home.passes = parseNumber(homeVal)
      stats.away.passes = parseNumber(awayVal)
    } else if (stat.includes('précision') || stat.includes('accuracy')) {
      stats.home.passAccuracy = parseNumber(homeVal)
      stats.away.passAccuracy = parseNumber(awayVal)
    } else if (stat.includes('faute') || stat.includes('foul')) {
      stats.home.fouls = parseNumber(homeVal)
      stats.away.fouls = parseNumber(awayVal)
    } else if (stat.includes('corner')) {
      stats.home.corners = parseNumber(homeVal)
      stats.away.corners = parseNumber(awayVal)
    } else if (stat.includes('hors-jeu') || stat.includes('offside')) {
      stats.home.offsides = parseNumber(homeVal)
      stats.away.offsides = parseNumber(awayVal)
    } else if (stat.includes('jaune') || stat.includes('yellow')) {
      stats.home.yellowCards = parseNumber(homeVal)
      stats.away.yellowCards = parseNumber(awayVal)
    } else if (stat.includes('rouge') || stat.includes('red')) {
      stats.home.redCards = parseNumber(homeVal)
      stats.away.redCards = parseNumber(awayVal)
    }
  })

  return stats
}

function extractPlayerPerformances($) {
  const performances = {
    home: [],
    away: []
  }

  // Home team players
  $('table.team-roster, .team-players').eq(0).find('tr').each((idx, row) => {
    const perf = parsePlayerRow($(row))
    if (perf) performances.home.push(perf)
  })

  // Away team players
  $('table.team-roster, .team-players').eq(1).find('tr').each((idx, row) => {
    const perf = parsePlayerRow($(row))
    if (perf) performances.away.push(perf)
  })

  return performances
}

function parsePlayerRow($row) {
  const cells = $row.find('td')
  if (cells.length < 3) return null

  const playerName = cells.eq(1).text().trim()
  const position = cells.eq(2).text().trim()
  
  // Look for rating/note (usually 0-10 or similar)
  const ratingText = cells.eq(cells.length - 1).text().trim()
  const rating = parseFloat(ratingText)

  // Look for minutes played
  let minutesPlayed = null
  cells.each((_, cell) => {
    const text = $(cell).text().trim()
    if (/^\d+['"]$/.test(text)) {
      minutesPlayed = parseInt(text)
    }
  })

  if (!playerName) return null

  return {
    name: playerName,
    position: position || null,
    rating: !isNaN(rating) ? rating : null,
    minutesPlayed: minutesPlayed,
    shirtNumber: null, // Would need more parsing
    status: 'active' // starter/sub/unused
  }
}

function parseNumber(str) {
  if (!str) return null
  const num = parseFloat(str.replace(/[^0-9.]/g, ''))
  return isNaN(num) ? null : num
}

/**
 * Store scraped match data in Supabase
 */
export async function storeMatchStats(sb, matchId, scrapedData) {
  if (!scrapedData || !matchId) return false

  try {
    // Store or update match_stats table (you'll need to create this)
    const { error } = await sb
      .from('match_stats')
      .upsert({
        match_id: matchId,
        formations: scrapedData.formations,
        stats: scrapedData.stats,
        player_performances: scrapedData.playerPerformances,
        scraped_at: scrapedData.scrapedAt
      }, { onConflict: 'match_id' })

    if (error) {
      console.error('Error storing match stats:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error in storeMatchStats:', err)
    return false
  }
}
