import { describe, it, expect, vi, afterEach } from 'vitest'
import { slugify, calculateDaysUntil, isInCurrentWeekOfYear } from './utils'

describe('slugify', () => {
  it('converts basic string to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes diacritics', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee')
  })

  it('removes special characters', () => {
    expect(slugify('Family & Friends!')).toBe('family-friends')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('a---b')).toBe('a-b')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('handles multiple spaces', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('preserves numbers', () => {
    expect(slugify('Tree 123')).toBe('tree-123')
  })
})

describe('calculateDaysUntil', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns positive days for a future date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13)) // 2026-04-13 Monday
    const future = new Date(2026, 3, 20) // 2026-04-20
    expect(calculateDaysUntil(future)).toBe(7)
  })

  it('returns negative days for a past date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13))
    const past = new Date(2026, 3, 10) // 2026-04-10
    expect(calculateDaysUntil(past)).toBe(-3)
  })

  it('returns 0 for today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13))
    const today = new Date(2026, 3, 13)
    expect(calculateDaysUntil(today)).toBe(0)
  })

  it('with ignoreYear, wraps to next year if date already passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13)) // April 13
    const pastMonth = new Date(2020, 0, 1) // Jan 1 (already passed)
    const days = calculateDaysUntil(pastMonth, { ignoreYear: true })
    expect(days).toBeGreaterThan(200) // wraps to Jan 1 2027
  })

  it('with ignoreYear, returns days until upcoming date this year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-13T00:00:00'))
    const upcoming = new Date(2020, 11, 25) // Dec 25
    const days = calculateDaysUntil(upcoming, { ignoreYear: true })
    // April 13 -> Dec 25 = 256 or 257 days depending on timezone rounding
    expect(days).toBeGreaterThanOrEqual(256)
    expect(days).toBeLessThanOrEqual(257)
  })

  it('with ignoreYear, handles Feb 29 in a non-leap year by clamping to Feb 28', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 0, 1)) // Jan 1, 2027 (non-leap)
    const leapDate = new Date(2024, 1, 29) // Feb 29
    const days = calculateDaysUntil(leapDate, { ignoreYear: true })
    // Should target Feb 28 2027 since 2027 is not a leap year
    expect(days).toBe(58) // Jan 1 -> Feb 28 = 58 days
  })
})

describe('isInCurrentWeekOfYear', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for a date within the current week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13)) // Monday April 13
    // Wednesday April 15 should be in the same week
    expect(isInCurrentWeekOfYear(new Date(2020, 3, 15))).toBe(true)
  })

  it('returns true for Monday (week start)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13)) // Monday
    expect(isInCurrentWeekOfYear(new Date(2020, 3, 13))).toBe(true)
  })

  it('returns true for Sunday (week end)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13)) // Monday
    expect(isInCurrentWeekOfYear(new Date(2020, 3, 19))).toBe(true)
  })

  it('returns false for a date in the previous week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13)) // Monday April 13
    expect(isInCurrentWeekOfYear(new Date(2020, 3, 12))).toBe(false) // Sunday April 12
  })

  it('returns false for a date in the next week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13)) // Monday April 13
    expect(isInCurrentWeekOfYear(new Date(2020, 3, 20))).toBe(false) // Monday April 20
  })

  it('returns false for a date in a different month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 13))
    expect(isInCurrentWeekOfYear(new Date(2020, 5, 15))).toBe(false)
  })

  it('handles Feb 29 in a non-leap year by clamping to Feb 28', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 1, 25)) // Feb 25, 2027 (Thursday, non-leap)
    // Feb 29 should clamp to Feb 28
    // Week of Feb 22-28: Monday Feb 22 to Sunday Feb 28
    expect(isInCurrentWeekOfYear(new Date(2024, 1, 29))).toBe(true)
  })
})
