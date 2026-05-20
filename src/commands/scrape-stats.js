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
 * Scrape match stats for matches (Flashscore first, Footmercato fallback)
 * Usage: npm run psg-seed -- scrape-stats [matchId]
 */
export async function scrapeStats(matchId = null) {
  try {
    console.log('🔍 Scraping match stats (Flashscore primary)...')
    if (!hasServiceRoleKey) {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY missing: scraping works, but DB writes may fail due to RLS.')
    }

    // Ensure match_stats table exists
    try {
      await sb.from('match_stats').select('id').limit(1)
    } catch (err) {
      console.log('📦 Creating match_stats table...')
      // Table doesn't exist, create it
      const { error } = await sb.rpc('execute_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS match_stats (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            match_id BIGINT NOT NULL UNIQUE REFERENCES matches(id),
            formations JSONB,
            stats JSONB,
            player_performances JSONB,
            scraped_at TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_match_stats_match_id ON match_stats(match_id);
        `
      }).catch(e => ({ error: e }))
      
      if (error) {
        console.warn('⚠️  Could not create table (may already exist):', error.message)
      }
    }

    let query = sb
      .from('matches')
      .select('id, home_team_id, away_team_id, match_date, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .eq('status', 'played')

    if (matchId) {
      query = query.eq('id', matchId)
    } else {
      // Limit to recent matches
      query = query.order('match_date', { ascending: false }).limit(10)
    }

    const { data: matches, error } = await query

    if (error) {
      console.error('Error fetching matches:', error)
      return
    }

    if (!matches || matches.length === 0) {
      console.log('No matches found to scrape')
      return
    }

    console.log(`Found ${matches.length} match(es) to scrape`)

    for (const match of matches) {
      const homeTeam = match.home_team?.name || 'Unknown'
      const awayTeam = match.away_team?.name || 'Unknown'
      const matchDate = match.match_date

      console.log(`\n📊 Scraping: ${homeTeam} vs ${awayTeam} (${matchDate})`)

      const scrapedData = await fetchMatchStats(homeTeam, awayTeam, matchDate)

      if (scrapedData) {
        console.log('✅ Stats scraped successfully')
        console.log(`  - Formation: ${scrapedData.formations.home} vs ${scrapedData.formations.away}`)
        console.log(`  - Home possession: ${scrapedData.stats.home.possession ?? 'n/a'}%`)
        console.log(`  - Away possession: ${scrapedData.stats.away.possession ?? 'n/a'}%`)
        console.log(`  - Player performances: ${scrapedData.playerPerformances.home.length} + ${scrapedData.playerPerformances.away.length}`)
        if (scrapedData.source) {
          console.log(`  - Source: ${scrapedData.source}`)
        }

        // Store in database
        const stored = await storeScrapedMatchData(sb, match.id, scrapedData)
        if (stored.ok) {
          console.log('  - Stored in database: yes')
        } else {
          console.log(`  - Stored in database: partial (stats=${stored.statsStored}, lineups=${stored.lineupsStored}, events=${stored.eventsStored})`)
        }
      } else {
        console.log('⚠️  Could not scrape stats for this match')
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('\n✅ Scraping completed!')
    process.exit(0)
  } catch (err) {
    console.error('Error in scrapeStats:', err)
    process.exit(1)
  }
}

// Keep module side-effect free. CLI entrypoint lives in bin/cli.js.

export default scrapeStats
