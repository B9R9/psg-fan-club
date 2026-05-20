import fs from 'node:fs';
import path from 'node:path';
import {
  buildHistoric,
  mapPosition,
  normalizeClubName,
  normalizeSeasonEntries,
  parseHistoric,
} from '../scraper/parser.js';

const SQL_COLUMNS = [
  'name',
  'club',
  'number',
  'position',
  'position_detail',
  'nationality',
  'photo_url',
  'bio',
  'historic',
  'seasons',
  'appearances_total',
  'goals_total',
  'assists_total',
  'is_active',
  'display_order',
];

export async function generate(options = {}) {
  const cwd = process.cwd();
  const inputPath = options.input || path.resolve(cwd, 'data/players.raw.json');
  const outputDir = options.outputDir || path.resolve(cwd, 'output');
  const outputSqlDir = path.join(outputDir, 'sql');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}. Run "psg-seed fetch" first.`);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(outputSqlDir, { recursive: true });

  const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!Array.isArray(source)) {
    throw new Error('Input must be an array of players.');
  }

  const cleaned = source
    .map((player, index) => normalizePlayer(player, index + 1))
    .filter((player) => Boolean(player.name));

  const deduped = dedupeByName(cleaned);
  deduped.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  deduped.forEach((player, i) => {
    player.display_order = i + 1;
  });

  const cleanedJsonPath = path.join(outputDir, 'players.cleaned.json');
  const sqlPath = path.join(outputSqlDir, 'players.sql');

  fs.writeFileSync(cleanedJsonPath, `${JSON.stringify(deduped, null, 2)}\n`, 'utf8');
  fs.writeFileSync(sqlPath, `${buildSql(deduped)}\n`, 'utf8');

  console.log(`Generated ${deduped.length} players`);
  console.log(`- ${path.relative(cwd, cleanedJsonPath)}`);
  console.log(`- ${path.relative(cwd, sqlPath)}`);
}

function normalizePlayer(input, displayOrder) {
  const name = cleanText(input?.name);
  const club = normalizeClubName(input?.club, 'PSG');

  const fromHistoric = parseHistoric(input?.historic, club);
  const fromSeasons = normalizeSeasonEntries(input?.seasons || [], club);
  const seasons = normalizeSeasonEntries([...fromHistoric, ...fromSeasons], club);

  return {
    name,
    club,
    number: normalizeNumber(input?.number),
    position: mapPosition(input?.position),
    position_detail: normalizeNullableText(input?.position_detail),
    nationality: normalizeNullableText(input?.nationality),
    photo_url: normalizeNullableText(input?.photo_url),
    bio: normalizeNullableText(input?.bio),
    historic: buildHistoric(seasons),
    seasons,
    stats_total: normalizeStats(input?.stats_total),
    is_active: Boolean(input?.is_active),
    display_order: displayOrder,
    source: normalizeNullableText(input?.source),
    source_url: normalizeNullableText(input?.source_url),
  };
}

function dedupeByName(players) {
  const map = new Map();

  for (const player of players) {
    if (!player.name) continue;
    const key = player.name.toLowerCase();
    const previous = map.get(key);

    if (!previous) {
      map.set(key, player);
      continue;
    }

    const mergedSeasons = normalizeSeasonEntries(
      [...(previous.seasons || []), ...(player.seasons || [])],
      'PSG'
    );

    map.set(key, {
      ...previous,
      nationality: previous.nationality || player.nationality,
      position: previous.position || player.position,
      position_detail: previous.position_detail || player.position_detail,
      number: previous.number ?? player.number,
      seasons: mergedSeasons,
      historic: buildHistoric(mergedSeasons),
      stats_total: mergeStats(previous.stats_total, player.stats_total),
      source: previous.source || player.source,
      source_url: previous.source_url || player.source_url,
    });
  }

  return [...map.values()];
}

function buildSql(players) {
  const tuples = players.map((player) => {
    const values = [
      sqlString(player.name),
      sqlString(player.club),
      sqlNullableNumber(player.number),
      sqlString(player.position),
      sqlNullableString(player.position_detail),
      sqlNullableString(player.nationality),
      sqlNullableString(player.photo_url),
      sqlNullableString(player.bio),
      sqlNullableString(player.historic),
      sqlJsonb(player.seasons || []),
      sqlNullableNumber(player.stats_total?.appearances),
      sqlNullableNumber(player.stats_total?.goals),
      sqlNullableNumber(player.stats_total?.assists),
      player.is_active ? 'true' : 'false',
      String(player.display_order),
    ];

    return `(${values.join(', ')})`;
  });

  return `alter table public.players add column if not exists appearances_total integer;\nalter table public.players add column if not exists goals_total integer;\nalter table public.players add column if not exists assists_total integer;\n\ncreate unique index if not exists players_name_unique_idx\non public.players (name);\n\ninsert into public.players (\n  ${SQL_COLUMNS.join(',\n  ')}\n)\nvalues\n${tuples.join(',\n')}\non conflict (name) do update\nset club = excluded.club,\n    number = excluded.number,\n    position = excluded.position,\n    position_detail = excluded.position_detail,\n    nationality = excluded.nationality,\n    photo_url = excluded.photo_url,\n    bio = excluded.bio,\n    historic = excluded.historic,\n    seasons = excluded.seasons,\n    appearances_total = excluded.appearances_total,\n    goals_total = excluded.goals_total,\n    assists_total = excluded.assists_total,\n    is_active = excluded.is_active,\n    display_order = excluded.display_order;`;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function normalizeNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeStats(stats) {
  return {
    appearances: normalizeNumber(stats?.appearances),
    goals: normalizeNumber(stats?.goals),
    assists: normalizeNumber(stats?.assists),
  };
}

function mergeStats(a, b) {
  return {
    appearances: maxNullableNumber(a?.appearances, b?.appearances),
    goals: maxNullableNumber(a?.goals, b?.goals),
    assists: maxNullableNumber(a?.assists, b?.assists),
  };
}

function maxNullableNumber(a, b) {
  const av = normalizeNumber(a);
  const bv = normalizeNumber(b);
  if (av == null) return bv;
  if (bv == null) return av;
  return Math.max(av, bv);
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNullableString(value) {
  return value == null ? 'NULL' : sqlString(value);
}

function sqlNullableNumber(value) {
  return value == null ? 'NULL' : String(value);
}

function sqlJsonb(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}
