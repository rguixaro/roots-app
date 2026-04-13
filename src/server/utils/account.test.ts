import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/db', () => ({
  db: {
    account: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import { getAccountByUserId } from './account'
import { db } from '@/server/db'
import * as Sentry from '@sentry/nextjs'

const mockedFindFirst = vi.mocked(db.account.findFirst)
const mockedCaptureException = vi.mocked(Sentry.captureException)

describe('getAccountByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns account when found', async () => {
    const account = { id: 'acc-1', userId: 'user-1', provider: 'google' }
    mockedFindFirst.mockResolvedValue(account as any)
    const result = await getAccountByUserId('user-1')
    expect(result).toEqual(account)
  })

  it('calls db with correct userId', async () => {
    mockedFindFirst.mockResolvedValue(null)
    await getAccountByUserId('user-123')
    expect(mockedFindFirst).toHaveBeenCalledWith({ where: { userId: 'user-123' } })
  })

  it('returns null when account is not found', async () => {
    mockedFindFirst.mockResolvedValue(null)
    const result = await getAccountByUserId('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null on database error', async () => {
    mockedFindFirst.mockRejectedValue(new Error('DB connection failed'))
    const result = await getAccountByUserId('user-1')
    expect(result).toBeNull()
  })

  it('calls Sentry.captureException on database error', async () => {
    const dbError = new Error('DB connection failed')
    mockedFindFirst.mockRejectedValue(dbError)
    await getAccountByUserId('user-1')
    expect(mockedCaptureException).toHaveBeenCalledWith(dbError, {
      level: 'warning',
      tags: { action: 'getAccountByUserId' },
    })
  })
})
