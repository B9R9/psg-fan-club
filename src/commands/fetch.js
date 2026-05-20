import fs from 'node:fs';
import path from 'node:path';
import { fetchWikipediaPlayers, WIKIPEDIA_PSG_PLAYERS_URL } from '../scraper/wikipedia.js';

export async function fetchPlayers(options = {}) {
  const dataDir = options.dataDir || path.resolve(process.cwd(), 'data');
  const outputPath = options.output || path.join(dataDir, 'players.raw.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log(`Fetching PSG players from: ${WIKIPEDIA_PSG_PLAYERS_URL}`);

  const rawPlayers = await fetchWikipediaPlayers();

  const payload = rawPlayers.map((player, index) => ({
    ...player,
    display_order: index + 1,
  }));

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Saved ${payload.length} players to ${path.relative(process.cwd(), outputPath)}`);
}
