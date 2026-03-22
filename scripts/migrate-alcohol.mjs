// Run once to create the Neon alcohol database schema
// Usage: ALCOHOL_DATABASE_URL="postgresql://..." node scripts/migrate-alcohol.mjs

import postgres from 'postgres'

const connectionString = process.env.ALCOHOL_DATABASE_URL
if (!connectionString) {
  console.error('ERROR: ALCOHOL_DATABASE_URL env var is required')
  process.exit(1)
}

const sql = postgres(connectionString, { ssl: 'require' })

async function migrate() {
  console.log('Creating tables in Neon alcohol database...')

  await sql`
    CREATE TABLE IF NOT EXISTS drink_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      location TEXT,
      company TEXT,
      drink_type TEXT,
      mood TEXT
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS drink_logs_user_created ON drink_logs (user_id, created_at DESC)`
  console.log('✓ drink_logs')

  await sql`
    CREATE TABLE IF NOT EXISTS user_triggers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      trigger_text TEXT,
      coping_strategy TEXT
    )
  `
  console.log('✓ user_triggers')

  await sql`
    CREATE TABLE IF NOT EXISTS user_reflections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      reflection_text TEXT,
      exercise_type TEXT
    )
  `
  console.log('✓ user_reflections')

  await sql`
    CREATE TABLE IF NOT EXISTS user_mindfulness_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      session_date DATE NOT NULL,
      UNIQUE(user_id, session_date)
    )
  `
  console.log('✓ user_mindfulness_sessions')

  await sql`
    CREATE TABLE IF NOT EXISTS achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      achievement_type TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ DEFAULT now()
    )
  `
  console.log('✓ achievements')

  await sql`
    CREATE TABLE IF NOT EXISTS user_goals (
      user_id TEXT PRIMARY KEY,
      weekly_limit INTEGER,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  console.log('✓ user_goals')

  console.log('\nAll tables created successfully.')
  await sql.end()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
