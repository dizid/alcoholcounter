// Tests for the local-midnight day rule (T-0588): after midnight, DST and travel.
import { describe, it, expect } from 'vitest'
import {
  isValidTimeZone, cleanTimeZone, localDate, startOfLocalDay, localDayRange,
  addDays, isDateString, tzAt, drinkDay, withTimeZone,
} from '../lib/localDay.mjs'

describe('time zone names', () => {
  it('accepts IANA names and refuses junk', () => {
    expect(isValidTimeZone('Asia/Bangkok')).toBe(true)
    expect(isValidTimeZone('Europe/Amsterdam')).toBe(true)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
    expect(isValidTimeZone('')).toBe(false)
    expect(isValidTimeZone(42)).toBe(false)
    expect(cleanTimeZone('nope')).toBe('UTC')
  })
})

describe('after midnight', () => {
  it('a drink at 00:15 in Bangkok belongs to the new local day, not the UTC day', () => {
    // 00:15 Bangkok on Nov 16 = 17:15 UTC on Nov 15
    const instant = '2026-11-15T17:15:00Z'
    expect(localDate(instant, 'Asia/Bangkok')).toBe('2026-11-16')
    expect(localDate(instant, 'UTC')).toBe('2026-11-15')
  })

  it('a drink at 23:59 in Bangkok still belongs to that day', () => {
    // 23:59 Bangkok on Nov 16 = 16:59 UTC on Nov 16
    expect(localDate('2026-11-16T16:59:00Z', 'Asia/Bangkok')).toBe('2026-11-16')
  })

  it('the Bangkok day starts at 17:00 UTC the day before and lasts 24 hours', () => {
    const [start, end] = localDayRange('2026-11-16', 'Asia/Bangkok')
    expect(start.toISOString()).toBe('2026-11-15T17:00:00.000Z')
    expect(end.toISOString()).toBe('2026-11-16T17:00:00.000Z')
  })
})

describe('DST', () => {
  it('the spring-forward day in Amsterdam is 23 hours', () => {
    // Mar 29 2026: clocks go from 02:00 to 03:00
    const [start, end] = localDayRange('2026-03-29', 'Europe/Amsterdam')
    expect(start.toISOString()).toBe('2026-03-28T23:00:00.000Z')
    expect(end.toISOString()).toBe('2026-03-29T22:00:00.000Z')
    expect((end - start) / 3600000).toBe(23)
  })

  it('the fall-back day in Amsterdam is 25 hours', () => {
    // Oct 25 2026: clocks go from 03:00 back to 02:00
    const [start, end] = localDayRange('2026-10-25', 'Europe/Amsterdam')
    expect(start.toISOString()).toBe('2026-10-24T22:00:00.000Z')
    expect(end.toISOString()).toBe('2026-10-25T23:00:00.000Z')
    expect((end - start) / 3600000).toBe(25)
  })

  it('a late drink on the DST day lands on that day', () => {
    // 23:30 Amsterdam (summer time, +2) on Mar 29 = 21:30 UTC
    expect(localDate('2026-03-29T21:30:00Z', 'Europe/Amsterdam')).toBe('2026-03-29')
    // 00:30 Amsterdam on Mar 30 = 22:30 UTC on Mar 29
    expect(localDate('2026-03-29T22:30:00Z', 'Europe/Amsterdam')).toBe('2026-03-30')
  })

  it('startOfLocalDay works for New York DST too', () => {
    // Nov 1 2026: US clocks fall back at 02:00
    expect(startOfLocalDay('2026-11-01', 'America/New_York').toISOString()).toBe('2026-11-01T04:00:00.000Z')
    expect(startOfLocalDay('2026-11-02', 'America/New_York').toISOString()).toBe('2026-11-02T05:00:00.000Z')
  })
})

describe('travel', () => {
  // Lived in Amsterdam, flew to Bangkok; the app saw Bangkok from Nov 18 08:00 UTC.
  const history = [
    { tz: 'Europe/Amsterdam', since: '2026-01-01T00:00:00Z' },
    { tz: 'Asia/Bangkok', since: '2026-11-18T08:00:00Z' },
  ]

  it('a late drink in Amsterdam keeps its Amsterdam day after arriving in Bangkok', () => {
    // 23:30 Amsterdam on Nov 16 = 22:30 UTC = 05:30 Bangkok on Nov 17
    expect(drinkDay('2026-11-16T22:30:00Z', history)).toBe('2026-11-16')
  })

  it('a drink after arriving uses the Bangkok day', () => {
    // 00:30 Bangkok on Nov 19 = 17:30 UTC on Nov 18
    expect(drinkDay('2026-11-18T17:30:00Z', history)).toBe('2026-11-19')
  })

  it('picks the zone in effect at the moment of the drink', () => {
    expect(tzAt('2026-11-18T07:59:00Z', history)).toBe('Europe/Amsterdam')
    expect(tzAt('2026-11-18T08:00:00Z', history)).toBe('Asia/Bangkok')
    // Before the first entry: the first zone
    expect(tzAt('2025-06-01T00:00:00Z', history)).toBe('Europe/Amsterdam')
    // No history: the fallback
    expect(tzAt('2026-11-18T08:00:00Z', [], 'Asia/Bangkok')).toBe('Asia/Bangkok')
  })

  it('records a zone change once, newest last', () => {
    const now = new Date('2026-11-20T10:00:00Z')
    const same = withTimeZone(history, 'Asia/Bangkok', now)
    expect(same).toEqual(history)
    const moved = withTimeZone(history, 'Europe/Amsterdam', now)
    expect(moved).toHaveLength(3)
    expect(moved[2]).toEqual({ tz: 'Europe/Amsterdam', since: '2026-11-20T10:00:00.000Z' })
    expect(withTimeZone(history, 'Not/AZone', now)).toEqual(history)
    expect(withTimeZone(null, 'Asia/Bangkok', now)).toEqual([{ tz: 'Asia/Bangkok', since: '2026-11-20T10:00:00.000Z' }])
  })
})

describe('date strings', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('only accepts real dates', () => {
    expect(isDateString('2026-11-16')).toBe(true)
    expect(isDateString('2026-02-30')).toBe(false)
    expect(isDateString('16-11-2026')).toBe(false)
    expect(isDateString(null)).toBe(false)
  })
})
