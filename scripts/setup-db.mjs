#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

// Load environment
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

// Read all migration files in order and apply them
async function applyMigrations() {
  try {
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log(`📦 Found ${files.length} migration(s)`)

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')

      console.log(`\n⚙️  Applying: ${file}`)
      console.log(`SQL:\n${sql.substring(0, 200)}...\n`)

      // We'll print instructions for manual execution
      console.log('ℹ️  To execute this migration in Supabase:')
      console.log('1. Go to Supabase Dashboard > SQL Editor')
      console.log('2. Create a new query and paste the SQL above')
      console.log('3. Execute the query\n')
    }

    console.log(`\n✅ Migration instructions generated`)
    console.log('\n📝 To automate: Store your DATABASE_URL in .env and use pg-migrate or similar')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

applyMigrations()
