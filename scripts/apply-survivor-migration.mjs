import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const sb = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260521000000_create_survivor_tables.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    // Parse statements more carefully
    const statements = sql
      .split(';\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))
    
    console.log(`📋 Applying migration with ${statements.length} statements...`)
    console.log(`   URL: ${supabaseUrl}`)
    
    let applied = 0
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim()
      if (!stmt) continue
      
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ')
      try {
        // Try rpc first
        const { error } = await sb.rpc('exec_sql', { query: stmt + ';' })
        
        if (!error) {
          applied++
          console.log(`✅ [${applied}] ${preview}...`)
        } else if (error.message?.includes('does not exist')) {
          console.log(`ℹ️  RPC unavailable - check Supabase dashboard`)
          break
        } else {
          console.log(`⚠️  [${i+1}] ${error.message}`)
        }
      } catch (err) {
        if (err.message?.includes('does not exist')) {
          console.log(`⚠️  RPC exec_sql not available in this Supabase version`)
          console.log(`📌 Please apply migration manually via Supabase dashboard:`)
          console.log(`   1. Go to SQL Editor`)
          console.log(`   2. Click "New Query"`)
          console.log(`   3. Copy content from: supabase/migrations/20260521000000_create_survivor_tables.sql`)
          console.log(`   4. Run query`)
          break
        }
        console.log(`❌ [${i+1}] ${err.message}`)
      }
    }
    
    if (applied > 0) {
      console.log(`\n✅ Applied ${applied}/${statements.length} statements`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

applyMigration()
