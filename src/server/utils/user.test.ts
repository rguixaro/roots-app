import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import { getUserById } from './user'
import { db } from '@/server/db'
import * as Sentry from '@sentry/nextjs'

const mockedFindFirst = vi.mocked(db.user.findFirst)
const mockedCaptureException = vi.mocked(Sentry.captureException)

describe('getUserById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when found', async () => {
    const user = { id: 'user-1', name: 'Alice', email: 'alice@test.com' }
    mockedFindFirst.mockResolvedValue(user as any)
    const result = await getUserById('user-1')
    expect(result).toEqual(user)
  })

  it('calls db with correct id', async () => {
    mockedFindFirst.mockResolvedValue(null)
    await getUserById('user-123')
    expect(mockedFindFirst).toHaveBeenCalledWith({ where: { id: 'user-123' } })
  })

  it('returns null when user is not found', async () => {
    mockedFindFirst.mockResolvedValue(null)
    const result = await getUserById('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockedFindFirst.mockRejectedValue(new Error('DB connection failed'))
    const result = await getUserById('user-1')
    expect(result).toBeNull()
  })

  it('calls Sentry.captureException on database error', async () => {
    const dbError = new Error('DB connection failed')
    mockedFindFirst.mockRejectedValue(dbError)
    await getUserById('user-1')
    expect(mockedCaptureException).toHaveBeenCalledWith(dbError, {
      level: 'warning',
      tags: { action: 'getUserById' },
    })
  })

  it('handles undefined id', async () => {
    mockedFindFirst.mockResolvedValue(null)
    const result = await getUserById(undefined)
    expect(result).toBeNull()
    expect(mockedFindFirst).toHaveBeenCalledWith({ where: { id: undefined } })
  })
})
