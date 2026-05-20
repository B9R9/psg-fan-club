#!/usr/bin/env node

import { generate } from '../src/commands/generate.js';
import { syncPlayers } from '../src/commands/sync.js';
import { fetchPlayers } from '../src/commands/fetch.js';
import { scrapeStats } from '../src/commands/scrape-stats.js';
import { watchAndScrapeMatches, startWatcherDaemon } from '../src/commands/watch-matches.js';

const cmd = process.argv[2];
const arg = process.argv[3];

try {
  switch (cmd) {
    case 'fetch':
      await fetchPlayers();
      break;

    case 'generate':
      await generate();
      break;

    case 'sync':
      await syncPlayers();
      break;

    case 'scrape-stats':
      await scrapeStats(arg);
      break;

    case 'watch':
      const interval = parseInt(arg) || 15;
      await startWatcherDaemon(interval);
      break;

    case 'check-matches':
      await watchAndScrapeMatches();
      break;

    default:
      printHelp();
      process.exit(cmd ? 1 : 0);
  }
} catch (error) {
  console.error(error?.message || error);
  process.exit(1);
}

function printHelp() {
  console.log(`\nPSG Seed CLI\n\nCommands:\n  psg-seed fetch          Fetch raw players from Wikipedia\n  psg-seed generate       Build SQL + cleaned dataset\n  psg-seed sync           Upsert cleaned dataset into Supabase\n  psg-seed scrape-stats   Scrape match stats (Flashscore, fallback Footmercato) [matchId]\n  psg-seed check-matches  Check for newly played matches and scrape stats\n  psg-seed watch          Run continuous watcher daemon [intervalMinutes]\n`);
}
