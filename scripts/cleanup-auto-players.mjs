#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

function normalizeNameKey(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const PSG_CANONICAL_KEYS = new Set([
  'achraf hakimi',
  'bradley barcola',
  'ousmane dembele',
  'desire doue',
  'khvicha kvaratskhelia',
  'lee kang in',
  'nuno mendes',
  'joao neves',
  'willian pacho',
  'goncalo ramos',
  'fabian ruiz',
  'matvey safonov',
  'warren zaire emery',
  'lucas beraldo'
])

async function updatePlayerStatusIfColumnExists(sb, ids, status) {
  if (!ids.length) return
  const { error } = await sb.from('players').update({ player_status: status }).in('id', ids)
  if (!error) return
  if (String(error.message || '').toLowerCase().includes('column')) return
  throw error
}

async function main() {
  loadDotEnv(path.resolve(process.cwd(), '.env'))

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY
  if (!url || !key) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
  }

  const sb = createClient(url, key)

  const { data: players, error } = await sb
    .from('players')
    .select('id,name,club,display_order,is_active')

  if (error) {
    console.error('Error loading players:', error.message)
    process.exit(1)
  }

  const autoPlayers = (players || []).filter((p) => Number(p.display_order) === 999)
  const trustedPlayers = (players || []).filter((p) => Number(p.display_order) !== 999)

  const trustedKeys = new Set(trustedPlayers.map((p) => normalizeNameKey(p.name)).filter(Boolean))
  for (const key of PSG_CANONICAL_KEYS) trustedKeys.add(key)

  const duplicateAutoIds = []
  const externalAutoIds = []

  for (const p of autoPlayers) {
    const key = normalizeNameKey(p.name)
    if (!key) continue
    if (trustedKeys.has(key)) {
      duplicateAutoIds.push(p.id)
    } else {
      externalAutoIds.push(p.id)
    }
  }

  if (duplicateAutoIds.length) {
    const { error: deleteError } = await sb.from('players').delete().in('id', duplicateAutoIds)
    if (deleteError) {
      console.error('Error deleting duplicate auto players:', deleteError.message)
      process.exit(1)
    }
  }

  if (externalAutoIds.length) {
    const { error: updateError } = await sb
      .from('players')
      .update({ club: 'MATCH_PLAYER', is_active: false })
      .in('id', externalAutoIds)

    if (updateError) {
      console.error('Error reclassifying external auto players:', updateError.message)
      process.exit(1)
    }
  }

  try {
    await updatePlayerStatusIfColumnExists(sb, externalAutoIds, 'match_player')
    const trustedIds = trustedPlayers.map((p) => p.id)
    await updatePlayerStatusIfColumnExists(sb, trustedIds, 'psg_squad')
  } catch (err) {
    console.error('Error updating player_status:', err.message)
    process.exit(1)
  }

  console.log(`Cleanup done: removed duplicates=${duplicateAutoIds.length}, reclassified_match_players=${externalAutoIds.length}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
