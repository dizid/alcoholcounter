-- T-0588 redesign: additive only. APPLIED to Neon lucky-cherry-33149869 / db alcohol on 2026-11-16 17:28 (Bangkok)
-- by Claude on Marc's OK ("alcohol db yes"). Direct SQL, never drizzle push (shared Neon project).
ALTER TABLE drink_logs
  ADD COLUMN IF NOT EXISTS std_drinks NUMERIC(4,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS "trigger" TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE user_goals
  ADD COLUMN IF NOT EXISTS daily_limit INT,
  ADD COLUMN IF NOT EXISTS af_days_goal INT,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE TABLE IF NOT EXISTS alcohol_free_days (
  user_id TEXT NOT NULL,
  day DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
-- Undo (only with Marc's OK; drops the new data):
-- ALTER TABLE drink_logs DROP COLUMN std_drinks, DROP COLUMN size, DROP COLUMN "trigger", DROP COLUMN note;
-- ALTER TABLE user_goals DROP COLUMN daily_limit, DROP COLUMN af_days_goal, DROP COLUMN settings;
-- DROP TABLE alcohol_free_days;
