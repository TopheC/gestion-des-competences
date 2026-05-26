import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = process.argv.includes('--cloud') ? '.env.cloud' : '.env'
const envPath = resolve(__dirname, '..', envFile)
const envContent = readFileSync(envPath, 'utf8')

function readEnv(key) {
  const line = envContent.split('\n').find(l => l.startsWith(`${key}=`))
  return line?.split('=').slice(1).join('=')?.trim()
}

const SUPABASE_URL = readEnv('VITE_SUPABASE_URL')
const SERVICE_ROLE_KEY = readEnv('VITE_SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(`Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in ${envFile}`)
  process.exit(1)
}

async function runSql(sql) {
  const url = `${SUPABASE_URL}/pg/v1/sql`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`SQL query failed (${res.status}): ${text.slice(0, 500)}`)
  }
  return text
}

async function main() {
  console.log(`📁 Utilisation de ${envFile}`)
  console.log(`🔗 Cible : ${SUPABASE_URL}\n`)

  const migrations = [
    { file: 'supabase/migrations/001_init.sql', label: 'Migration 001 — Structure initiale' },
    { file: 'supabase/migrations/002_rls_and_indexes.sql', label: 'Migration 002 — RLS + Indexes' },
  ]

  for (const m of migrations) {
    const filePath = resolve(__dirname, '..', m.file)
    console.log(`▶ ${m.label}...`)
    const sql = readFileSync(filePath, 'utf8')
    try {
      await runSql(sql)
      console.log(`✅ ${m.file} — OK\n`)
    } catch (err) {
      console.error(`❌ ${m.file} — ${err.message}\n`)
    }
  }

  console.log('=== Migrations terminées ===')
}

main().catch(err => {
  console.error('ERREUR:', err.message)
  process.exit(1)
})
