import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/server/db', () => ({
  db: {
    user: { update: vi.fn(), delete: vi.fn() },
    treeAccess: { findMany: vi.fn(), update: vi.fn() },
    tree: { delete: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/auth', () => ({ signOut: vi.fn(), auth: vi.fn() }))
vi.mock('@/server/utils', () => ({
  assertAuthenticated: vi.fn(),
  assertRole: vi.fn(),
  slugify: vi.fn((s: string) => s.toLowerCase().replace(/\s+/g, '-')),
  getChanges: vi.fn(),
  checkTreeAccess: vi.fn(),
  getUserById: vi.fn(),
  getAccountByUserId: vi.fn(),
  calculateDaysUntil: vi.fn(),
  isInCurrentWeekOfYear: vi.fn(),
}))

import { db } from '@/server/db'
import { assertAuthenticated } from '@/server/utils'
import { signOut } from '@/auth'
import { updateProfile, deleteProfile } from './profile'

const mockDb = db as any
const mockAssertAuth = assertAuthenticated as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockAssertAuth.mockResolvedValue('user-1')
  mockDb.$transaction.mockImplementation(async (fn: any) => fn(mockDb))
})

describe('updateProfile', () => {
  const validValues = { name: 'Alice', email: 'alice@example.com', newsletter: true, language: 'EN' as const }

  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await updateProfile(validValues)
    expect(result.error).toBe(true)
  })

  it('updates profile successfully', async () => {
    mockDb.user.update.mockResolvedValue({})
    const result = await updateProfile(validValues)
    expect(result.error).toBe(false)
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Alice', email: 'alice@example.com', newsletter: true, language: 'EN' },
    })
  })

  it('returns error-email-in-use on P2002', async () => {
    mockDb.user.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6.0.0' })
    )
    const result = await updateProfile(validValues)
    expect(result).toEqual({ error: true, message: 'error-email-in-use' })
  })
})

describe('deleteProfile', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await deleteProfile()
    expect(result.error).toBe(true)
  })

  it('deletes tree when user is the sole member', async () => {
    mockDb.treeAccess.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        role: 'ADMIN',
        tree: { id: 'tree-1', accesses: [{ userId: 'user-1', role: 'ADMIN' }] },
      },
    ])
    mockDb.tree.delete.mockResolvedValue({})
    mockDb.user.delete.mockResolvedValue({})

    const result = await deleteProfile()
    expect(result.error).toBe(false)
    expect(mockDb.tree.delete).toHaveBeenCalledWith({ where: { id: 'tree-1' } })
    expect(mockDb.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    expect(signOut).toHaveBeenCalled()
  })

  it('transfers admin role to another member for shared trees', async () => {
    mockDb.treeAccess.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        role: 'ADMIN',
        tree: {
          id: 'tree-2',
          accesses: [
            { id: 'access-1', userId: 'user-1', role: 'ADMIN' },
            { id: 'access-2', userId: 'user-2', role: 'EDITOR' },
          ],
        },
      },
    ])
    mockDb.treeAccess.update.mockResolvedValue({})
    mockDb.user.delete.mockResolvedValue({})

    const result = await deleteProfile()
    expect(result.error).toBe(false)
    expect(mockDb.treeAccess.update).toHaveBeenCalledWith({
      where: { id: 'access-2' },
      data: { role: 'ADMIN' },
    })
    expect(signOut).toHaveBeenCalled()
  })

  it('promotes VIEWER when no ADMIN or EDITOR available', async () => {
    mockDb.treeAccess.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        role: 'ADMIN',
        tree: {
          id: 'tree-3',
          accesses: [
            { id: 'access-1', userId: 'user-1', role: 'ADMIN' },
            { id: 'access-3', userId: 'user-3', role: 'VIEWER' },
          ],
        },
      },
    ])
    mockDb.treeAccess.update.mockResolvedValue({})
    mockDb.user.delete.mockResolvedValue({})

    const result = await deleteProfile()
    expect(result.error).toBe(false)
    expect(mockDb.treeAccess.update).toHaveBeenCalledWith({
      where: { id: 'access-3' },
      data: { role: 'ADMIN' },
    })
    expect(signOut).toHaveBeenCalled()
  })
})
