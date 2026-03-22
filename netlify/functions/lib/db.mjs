// Neon PostgreSQL connection singleton
import postgres from 'postgres'

let sql

export function getDb() {
  if (!sql) {
    sql = postgres(process.env.ALCOHOL_DATABASE_URL, { ssl: 'require', max: 1 })
  }
  return sql
}
