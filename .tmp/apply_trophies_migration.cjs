const fs = require('fs')

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2]
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

const sql = fs.readFileSync('supabase/migrations/20260520130000_create_trophies_table.sql', 'utf8')

import('@supabase/supabase-js')
  .then(async ({ createClient }) => {
    const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_KEY)

    let rpc = await sb.rpc('execute_sql', { sql })
    if (rpc.error) {
      const alt = await sb.from('_sql').insert([{ sql }])
      if (alt.error) {
        console.error(alt.error.message)
        process.exit(1)
      }
    }

    const { error } = await sb.from('trophies').select('id').limit(1)
    if (error) {
      console.error(error.message)
      process.exit(1)
    }

    console.log('trophies migration applied and table reachable')
  })
  .catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
