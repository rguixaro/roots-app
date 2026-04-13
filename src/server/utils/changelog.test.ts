import { describe, it, expect } from 'vitest'
import { getChanges } from './changelog'

describe('getChanges', () => {
  it('returns null when no fields changed', () => {
    const prev = { name: 'Alice', age: 30 }
    const next = { name: 'Alice', age: 30 }
    expect(getChanges(prev, next, ['name', 'age'])).toBeNull()
  })

  it('detects a single changed field', () => {
    const prev = { name: 'Alice', age: 30 }
    const next = { name: 'Bob', age: 30 }
    const result = getChanges(prev, next, ['name', 'age'])
    expect(result).toEqual({ name: { before: 'Alice', after: 'Bob' } })
  })

  it('detects multiple changed fields', () => {
    const prev = { name: 'Alice', age: 30 }
    const next = { name: 'Bob', age: 31 }
    const result = getChanges(prev, next, ['name', 'age'])
    expect(result).toEqual({
      name: { before: 'Alice', after: 'Bob' },
      age: { before: 30, after: 31 },
    })
  })

  it('only compares fields in fieldsToCompare', () => {
    const prev = { name: 'Alice', age: 30, email: 'a@b.com' }
    const next = { name: 'Alice', age: 30, email: 'c@d.com' }
    expect(getChanges(prev, next, ['name', 'age'])).toBeNull()
  })

  it('normalizes Date values to ISO strings for comparison', () => {
    const date1 = new Date('2024-01-01T00:00:00.000Z')
    const date2 = new Date('2024-06-15T00:00:00.000Z')
    const prev = { birthDate: date1 }
    const next = { birthDate: date2 }
    const result = getChanges(prev, next, ['birthDate'])
    expect(result).toEqual({
      birthDate: {
        before: date1.toISOString(),
        after: date2.toISOString(),
      },
    })
  })

  it('returns null when Date values are identical', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    const prev = { birthDate: new Date(date.getTime()) }
    const next = { birthDate: new Date(date.getTime()) }
    expect(getChanges(prev, next, ['birthDate'])).toBeNull()
  })

  it('handles undefined fields gracefully', () => {
    const prev = { name: 'Alice' }
    const next = { name: 'Alice' }
    const result = getChanges(prev, next, ['name', 'nonexistent'])
    expect(result).toBeNull()
  })

  it('detects change from value to undefined', () => {
    const prev = { name: 'Alice' } as Record<string, any>
    const next = {} as Record<string, any>
    const result = getChanges(prev, next, ['name'])
    expect(result).toEqual({
      name: { before: 'Alice', after: undefined },
    })
  })
})
