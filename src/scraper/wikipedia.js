import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  buildHistoric,
  mapPosition,
  normalizeSeasonEntries,
  parseWikipediaYearsToSeasons,
} from './parser.js';

export const WIKIPEDIA_PSG_PLAYERS_URL =
  'https://en.wikipedia.org/wiki/List_of_Paris_Saint-Germain_FC_players';

export async function fetchWikipediaPlayers() {
  const { data } = await axios.get(WIKIPEDIA_PSG_PLAYERS_URL, {
    timeout: 20000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; PSGSeedBot/1.0; +https://en.wikipedia.org/wiki/List_of_Paris_Saint-Germain_FC_players)',
    },
  });

  const $ = cheerio.load(data);
  const players = extractPlayers($);

  const deduped = dedupePlayers(players);
  deduped.sort((a, b) => a.name.localeCompare(b.name, 'en'));

  return deduped;
}

function extractPlayers($) {
  const out = [];
  $('table.wikitable tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 3) return;

    const name = cleanupText(cells.eq(0).text());
    const positionRaw = cleanupText(cells.eq(1).text());
    const yearsRaw = cleanupText(cells.eq(2).text());
    const appearances = parseStat(cells.eq(3).text());
    const goals = parseStat(cells.eq(4).text());
    const assists = parseStat(cells.eq(5).text());

    if (!name || /player/i.test(name)) return;
    if (!positionRaw) return;

    const seasons = normalizeSeasonEntries(parseWikipediaYearsToSeasons(yearsRaw, 'PSG'), 'PSG');

    out.push({
      name,
      club: 'PSG',
      number: null,
      position: mapPosition(positionRaw),
      position_detail: null,
      nationality: null,
      photo_url: null,
      bio: null,
      historic: buildHistoric(seasons),
      seasons,
      stats_total: {
        appearances,
        goals,
        assists,
      },
      is_active: false,
      display_order: 0,
      source: 'wikipedia',
      source_url: WIKIPEDIA_PSG_PLAYERS_URL,
    });
  });

  return out;
}

function cleanupText(text) {
  return String(text || '')
    .replace(/\.mw-parser-output\s*\{[^}]*\}/g, ' ')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseStat(text) {
  const cleaned = cleanupText(text).replace(/,/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function dedupePlayers(players) {
  const seen = new Map();

  for (const player of players) {
    const key = player.name.toLowerCase();
    const current = seen.get(key);

    if (!current) {
      seen.set(key, player);
      continue;
    }

    const mergedSeasons = normalizeSeasonEntries(
      [...(current.seasons || []), ...(player.seasons || [])],
      'PSG'
    );

    seen.set(key, {
      ...current,
      nationality: current.nationality || player.nationality,
      position: current.position || player.position,
      seasons: mergedSeasons,
      historic: buildHistoric(mergedSeasons),
      stats_total: mergeStats(current.stats_total, player.stats_total),
    });
  }

  return [...seen.values()];
}

function mergeStats(a, b) {
  return {
    appearances: maxNullable(a?.appearances, b?.appearances),
    goals: maxNullable(a?.goals, b?.goals),
    assists: maxNullable(a?.assists, b?.assists),
  };
}

function maxNullable(a, b) {
  const av = Number.isFinite(a) ? a : null;
  const bv = Number.isFinite(b) ? b : null;
  if (av == null) return bv;
  if (bv == null) return av;
  return Math.max(av, bv);
}
