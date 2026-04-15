import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/db', () => ({
  db: {
    treeAccess: {
      findFirst: vi.fn(),
    },
  },
}))

import { checkTreeAccess, assertRole } from './access'
import { db } from '@/server/db'

const mockedFindFirst = vi.mocked(db.treeAccess.findFirst)

describe('checkTreeAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns access record when user has matching role', async () => {
    const accessRecord = { id: 'access-1', treeId: 'tree-1', userId: 'user-1', role: 'EDITOR' }
    mockedFindFirst.mockResolvedValue(accessRecord as any)
    const result = await checkTreeAccess('tree-1', 'user-1')
    expect(result).toEqual(accessRecord)
  })

  it('returns null when no matching role is found', async () => {
    mockedFindFirst.mockResolvedValue(null)
    const result = await checkTreeAccess('tree-1', 'user-1')
    expect(result).toBeNull()
  })

  it('uses default roles EDITOR and ADMIN', async () => {
    mockedFindFirst.mockResolvedValue(null)
    await checkTreeAccess('tree-1', 'user-1')
    expect(mockedFindFirst).toHaveBeenCalledWith({
      where: { treeId: 'tree-1', userId: 'user-1', role: { in: ['EDITOR', 'ADMIN'] } },
    })
  })

  it('accepts custom roles parameter', async () => {
    mockedFindFirst.mockResolvedValue(null)
    await checkTreeAccess('tree-1', 'user-1', ['ADMIN'])
    expect(mockedFindFirst).toHaveBeenCalledWith({
      where: { treeId: 'tree-1', userId: 'user-1', role: { in: ['ADMIN'] } },
    })
  })
})

describe('assertRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not throw when user has access', async () => {
    const accessRecord = { id: 'access-1', treeId: 'tree-1', userId: 'user-1', role: 'ADMIN' }
    mockedFindFirst.mockResolvedValue(accessRecord as any)
    await expect(assertRole('tree-1', 'user-1')).resolves.not.toThrow()
  })

  it('throws "error-no-permission" when user has no access', async () => {
    mockedFindFirst.mockResolvedValue(null)
    await expect(assertRole('tree-1', 'user-1')).rejects.toThrow('error-no-permission')
  })

  it('uses default roles EDITOR and ADMIN', async () => {
    mockedFindFirst.mockResolvedValue(null)
    try { await assertRole('tree-1', 'user-1') } catch {}
    expect(mockedFindFirst).toHaveBeenCalledWith({
      where: { treeId: 'tree-1', userId: 'user-1', role: { in: ['EDITOR', 'ADMIN'] } },
    })
  })

  it('throws "error-no-permission" with custom roles when no access', async () => {
    mockedFindFirst.mockResolvedValue(null)
    await expect(assertRole('tree-1', 'user-1', ['ADMIN'])).rejects.toThrow('error-no-permission')
  })
})
