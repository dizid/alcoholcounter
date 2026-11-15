// Daily caps on AI calls (Grok advice + mindfulness tips together).
// Accounts are free (any Google account can sign in), so the login check alone
// does not bound Marc's xAI bill: these counters do (T-0586).
// Counters live in Netlify Blobs, one key per UTC day, so no DB table and no cron.
import { getStore } from '@netlify/blobs'

// Per signed-in user per UTC day. The Dashboard asks for advice each time it opens,
// so a normal user needs a handful; 20 leaves room without allowing a script loop.
export const PER_USER_DAILY_CAP = 20
// For ALL users together per UTC day: the ceiling on spend if many accounts are made.
// At grok-4.3 prices (~$0.006 per answer) 150 calls is about $1 a day at most.
export const GLOBAL_DAILY_CAP = 150

// A write that loses a race with a parallel call reads again, at most this often.
const MAX_COUNTER_TRIES = 8

// UTC date, e.g. "2026-11-15"
export function utcDay(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

/**
 * Adds 1 to the counter at `key` if it is still under `cap`.
 * The write is conditional on the value just read (ETag, or onlyIfNew for the
 * first call of the day), so parallel calls can't overwrite each other's count.
 * Returns 'ok' (counted), 'full' (cap reached) or 'busy' (kept losing races).
 */
export async function incrementUnderCap(store, key, cap) {
  for (let attempt = 0; attempt < MAX_COUNTER_TRIES; attempt++) {
    const entry = await store.getWithMetadata(key)
    const used = Number(entry?.data) || 0
    if (used >= cap) return 'full'
    const result = entry
      ? await store.set(key, String(used + 1), { onlyIfMatch: entry.etag })
      : await store.set(key, '1', { onlyIfNew: true })
    if (result?.modified) return 'ok'
  }
  return 'busy'
}

/**
 * Claims one AI call for this user today.
 * Returns 'ok', 'user_limit', 'global_limit', 'busy' or 'unavailable'.
 * Fails CLOSED: if the counter store can't be reached, no AI call is made
 * (if we can't count, we don't spend). The user's own count goes first, so a
 * call refused by the global ceiling still uses one of that user's 20 (harmless:
 * nobody can call more that day anyway).
 */
export async function claimAiCall(userId, { store, now } = {}) {
  const day = utcDay(now)
  try {
    const counters = store || getStore({ name: 'ai-calls', consistency: 'strong' })
    const userResult = await incrementUnderCap(counters, `user/${day}/${userId}`, PER_USER_DAILY_CAP)
    if (userResult === 'full') return 'user_limit'
    if (userResult === 'busy') return 'busy'
    const globalResult = await incrementUnderCap(counters, `global/${day}`, GLOBAL_DAILY_CAP)
    if (globalResult === 'full') return 'global_limit'
    if (globalResult === 'busy') return 'busy'
    return 'ok'
  } catch (err) {
    console.error('AI call counter unavailable:', err instanceof Error ? err.message : String(err))
    return 'unavailable'
  }
}
