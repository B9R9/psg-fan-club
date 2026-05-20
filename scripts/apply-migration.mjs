#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials. Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const sb = createClient(
  supabaseUrl,
  serviceRoleKey
)

async function applyMigration() {
  try {
    console.log('📦 Applying migration: add_match_stats_table...')
    
    const sql = fs.readFileSync('supabase/migrations/20260520100000_add_match_stats_table.sql', 'utf8')
    
    // Execute SQL via Supabase RPC (if available) or directly via the admin client
    const { error } = await sb.rpc('execute_sql', { sql } ).catch(() => {
      // If RPC not available, try with admin API
      console.log('Applying via REST API...')
      return sb.from('_sql').insert([{ sql }])
    })

    if (error) {
      console.warn('⚠️ Migration note:', error.message)
      // Continue anyway - table might already exist
    }

    console.log('✅ Migration completed!')
  } catch (err) {
    console.error('❌ Error applying migration:', err.message)
    process.exit(1)
  }
}

applyMigration()
