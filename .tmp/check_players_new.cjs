const fs = require('fs')

const env = {}
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2]
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[m[1]] = v
}

import('@supabase/supabase-js')
  .then(({ createClient }) => {
    const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_KEY)
    return sb
      .from('players')
      .select('name,number,position,display_order,appearances_total,goals_total,assists_total')
      .eq('display_order', 999)
      .order('appearances_total', { ascending: false, nullsFirst: false })
      .limit(30)
  })
  .then(({ data, error }) => {
    if (error) {
      console.error(error.message)
      process.exit(1)
    }
    console.log(JSON.stringify(data, null, 2))
  })
  .catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
