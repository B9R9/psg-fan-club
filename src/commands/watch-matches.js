import { fetchMatchStats, storeScrapedMatchData } from '../scraper/flashscore.js'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

// Load environment variables
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadDotEnv(path.resolve(process.cwd(), '.env'))

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY
)
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * Watch for newly played matches and scrape stats
 * Run this as a cron job or long-running process
 */
export async function watchAndScrapeMatches() {
  try {
    console.log('👀 Watching for newly played matches...')
    if (!hasServiceRoleKey) {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY missing: scraping works, but DB writes may fail due to RLS.')
    }

    // Get matches that were just marked as played but don't have stats yet
    const { data: playedMatches, error } = await sb
      .from('matches')
      .select(`
        id, match_date, home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name)
      `)
      .eq('status', 'played')
      .order('match_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching matches:', error)
      return
    }

    // Check which ones don't have stats yet
    const toScrape = []
    for (const match of playedMatches) {
      try {
        const { data: stats, error } = await sb
          .from('match_stats')
          .select('id')
          .eq('match_id', match.id)
          .single()

        if (!stats || error) {
          toScrape.push(match)
        }
      } catch (err) {
        // No stats found, add to scrape list
        toScrape.push(match)
      }
    }

    if (toScrape.length === 0) {
      console.log('✅ No new matches to scrape')
      return
    }

    console.log(`\n🔄 Found ${toScrape.length} matches to scrape:`)

    for (const match of toScrape) {
      const homeTeam = match.home_team?.name || 'Unknown'
      const awayTeam = match.away_team?.name || 'Unknown'
      const matchDate = match.match_date

      console.log(`\n⏱️  Scraping: ${homeTeam} vs ${awayTeam} (${matchDate})`)

      const scrapedData = await fetchMatchStats(homeTeam, awayTeam, matchDate)

      if (scrapedData) {
        console.log('✅ Stats scraped successfully')
        const stored = await storeScrapedMatchData(sb, match.id, scrapedData)
        if (stored.ok) {
          console.log('✔️  Stored in database')
        } else {
          console.log(`⚠️  Could not fully store in database (stats=${stored.statsStored}, lineups=${stored.lineupsStored}, events=${stored.eventsStored})`)
        }
      } else {
        console.log('⚠️  Could not scrape (Flashscore/Footmercato data not available)')
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('\n✅ Watch cycle completed!')
  } catch (err) {
    console.error('Error in watchAndScrapeMatches:', err)
  }
}

/**
 * Run watcher in daemon mode (auto-restart every 15 minutes)
 */
export async function startWatcherDaemon(intervalMinutes = 15) {
  console.log(`🚀 Starting match scraper daemon (checking every ${intervalMinutes} min)`)

  // Run immediately
  await watchAndScrapeMatches()

  // Then run periodically
  setInterval(async () => {
    try {
      await watchAndScrapeMatches()
    } catch (err) {
      console.error('Error in daemon loop:', err.message)
    }
  }, intervalMinutes * 60 * 1000)
}

// Keep module side-effect free. CLI entrypoint lives in bin/cli.js.

export default watchAndScrapeMatches
