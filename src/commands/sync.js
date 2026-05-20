import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_CHUNK_SIZE = 200;

export async function syncPlayers(options = {}) {
  loadDotEnv(path.resolve(process.cwd(), '.env'));

  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    '';

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.'
    );
  }

  const inputPath = options.input || path.resolve(process.cwd(), 'output/players.cleaned.json');
  const chunkSize = Number(options.chunkSize || DEFAULT_CHUNK_SIZE);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}. Run "psg-seed fetch" then "psg-seed generate" first.`);
  }

  const rows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!Array.isArray(rows)) {
    throw new Error('Input JSON must be an array of players.');
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await checkStatsColumns(supabase);

  const payload = rows.map(toDbPayload);

  let inserted = 0;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const batch = payload.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('players')
      .upsert(batch, { onConflict: 'name' });

    if (error) {
      throw new Error(`Sync failed around rows ${i + 1}-${Math.min(i + chunkSize, payload.length)}: ${error.message}`);
    }

    inserted += batch.length;
    console.log(`Synced ${inserted}/${payload.length}`);
  }

  console.log(`DB sync complete: ${inserted} players upserted in public.players`);
}

function toDbPayload(player) {
  return {
    name: textOrNull(player.name),
    club: textOrNull(player.club) || 'PSG',
    number: numberOrNull(player.number),
    position: textOrNull(player.position),
    position_detail: textOrNull(player.position_detail),
    nationality: textOrNull(player.nationality),
    photo_url: textOrNull(player.photo_url),
    bio: textOrNull(player.bio),
    historic: textOrNull(player.historic),
    seasons: Array.isArray(player.seasons) ? player.seasons : [],
    appearances_total: numberOrNull(player?.stats_total?.appearances),
    goals_total: numberOrNull(player?.stats_total?.goals),
    assists_total: numberOrNull(player?.stats_total?.assists),
    is_active: Boolean(player.is_active),
    display_order: numberOrNull(player.display_order),
  };
}

async function checkStatsColumns(supabase) {
  const { error } = await supabase
    .from('players')
    .select('id,appearances_total,goals_total,assists_total')
    .limit(1);

  if (!error) return;

  if (error.message?.includes('column') || error.code === '42703') {
    throw new Error(
      'Stats columns are missing in public.players. Run output/sql/players.sql (or add appearances_total, goals_total, assists_total) then retry.'
    );
  }

  throw new Error(`Cannot validate players table: ${error.message}`);
}

function textOrNull(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function numberOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}
