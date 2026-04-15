import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/server/db', () => ({
  db: {
    tree: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    treeAccess: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    treeNode: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    treeEdge: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    activityLog: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    picture: { findMany: vi.fn(), deleteMany: vi.fn() },
    pictureTag: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendTreeInvitationEmail: vi.fn().mockResolvedValue(true) }))
vi.mock('@/lib/s3', () => ({ deleteFileFromS3: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/utils/language', () => ({ languageToLocale: vi.fn(() => 'en') }))
vi.mock('@/auth', () => ({ auth: vi.fn(), signOut: vi.fn() }))
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
import { assertAuthenticated, assertRole } from '@/server/utils'
import { sendTreeInvitationEmail } from '@/lib/email'
import { deleteFileFromS3 } from '@/lib/s3'
import * as Sentry from '@sentry/nextjs'
import {
  createTree,
  updateTree,
  inviteMember,
  updateMember,
  removeMember,
  createTreeNode,
  updateTreeNode,
  createTreeEdge,
  deleteTreeNode,
  deleteTreeEdge,
  getTreeNodes,
  getTimelineEvents,
} from './trees'

const mockDb = db as any
const mockAssertAuth = assertAuthenticated as ReturnType<typeof vi.fn>
const mockAssertRole = assertRole as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockAssertAuth.mockResolvedValue('user-1')
  mockAssertRole.mockResolvedValue(undefined)
  mockDb.$transaction.mockImplementation(async (fn: any) => fn(mockDb))
})

// ─── createTree ──────────────────────────────────────────
describe('createTree', () => {
  const values = { name: 'My Tree', type: 'HUMAN' as const }

  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await createTree(values)
    expect(result.error).toBe(true)
  })

  it('creates tree successfully', async () => {
    const tree = { id: 't1', slug: 'my-tree', name: 'My Tree', accesses: [] }
    mockDb.tree.create.mockResolvedValue(tree)
    const result = await createTree(values)
    expect(result.error).toBe(false)
    expect(result.tree).toEqual(tree)
  })

  it('returns error-tree-exists on P2002', async () => {
    mockDb.tree.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: '6.0.0' })
    )
    const result = await createTree(values)
    expect(result).toEqual({ error: true, message: 'error-tree-exists' })
  })
})

// ─── updateTree ──────────────────────────────────────────
describe('updateTree', () => {
  const values = { name: 'Updated', type: 'HUMAN' as const }

  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await updateTree('t1', values)
    expect(result.error).toBe(true)
  })

  it('returns error when no permission', async () => {
    mockAssertRole.mockRejectedValue(new Error('error-no-permission'))
    const result = await updateTree('t1', values)
    expect(result).toEqual({ error: true, message: 'error-no-permission' })
  })

  it('updates tree and creates activity log on changes', async () => {
    const prevTree = { id: 't1', name: 'Old', type: 'HUMAN', newsletter: false }
    const updatedTree = { id: 't1', name: 'Updated', type: 'HUMAN', accesses: [] }
    mockDb.tree.findUnique.mockResolvedValue(prevTree)
    mockDb.tree.update.mockResolvedValue(updatedTree)
    mockDb.activityLog.create.mockResolvedValue({})
    const { getChanges } = await import('@/server/utils')
    ;(getChanges as ReturnType<typeof vi.fn>).mockReturnValue({ name: { before: 'Old', after: 'Updated' } })

    const result = await updateTree('t1', values)
    expect(result.error).toBe(false)
    expect(mockDb.activityLog.create).toHaveBeenCalled()
  })

  it('does not create activity log when nothing changed', async () => {
    const prevTree = { id: 't1', name: 'Updated', type: 'HUMAN', newsletter: false }
    const updatedTree = { id: 't1', name: 'Updated', type: 'HUMAN', accesses: [] }
    mockDb.tree.findUnique.mockResolvedValue(prevTree)
    mockDb.tree.update.mockResolvedValue(updatedTree)
    const { getChanges } = await import('@/server/utils')
    ;(getChanges as ReturnType<typeof vi.fn>).mockReturnValue(null)

    const result = await updateTree('t1', values)
    expect(result.error).toBe(false)
    expect(mockDb.activityLog.create).not.toHaveBeenCalled()
  })
})

// ─── inviteMember ────────────────────────────────────────
describe('inviteMember', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await inviteMember('t1', 'bob@example.com', 'EDITOR')
    expect(result.error).toBe(true)
  })

  it('returns error when no permission', async () => {
    mockAssertRole.mockRejectedValue(new Error('error-no-permission'))
    const result = await inviteMember('t1', 'bob@example.com', 'EDITOR')
    expect(result).toEqual({ error: true, message: 'error-no-permission' })
  })

  it('prevents non-admin from assigning admin role', async () => {
    mockDb.treeAccess.findFirst.mockResolvedValue({ role: 'EDITOR' })
    const result = await inviteMember('t1', 'bob@example.com', 'ADMIN')
    expect(result).toEqual({ error: true, message: 'error-no-permission' })
  })

  it('returns error when user not found', async () => {
    mockDb.treeAccess.findFirst.mockResolvedValue(null) // no role check needed for EDITOR
    mockDb.user.findUnique.mockResolvedValue(null)
    const result = await inviteMember('t1', 'bob@example.com', 'EDITOR')
    expect(result).toEqual({ error: true, message: 'error-user-not-found' })
  })

  it('returns error when user already in tree', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'bob@example.com' })
    mockDb.treeAccess.findFirst.mockResolvedValue({ id: 'existing-access' })
    const result = await inviteMember('t1', 'bob@example.com', 'EDITOR')
    expect(result).toEqual({ error: true, message: 'error-user-already-in-tree' })
  })

  it('creates access and sends invitation email', async () => {
    // First findFirst call is in assertRole (already mocked as resolved)
    // Second findFirst for role check won't happen for EDITOR role
    mockDb.user.findUnique
      .mockResolvedValueOnce({ id: 'user-2', email: 'bob@example.com', name: 'Bob' }) // invited user
      .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com', name: 'Alice' }) // inviter
    mockDb.treeAccess.findFirst.mockResolvedValue(null) // existing check
    mockDb.treeAccess.create.mockResolvedValue({})
    const tree = { id: 't1', name: 'My Tree', slug: 'my-tree', accesses: [] }
    mockDb.tree.findUnique.mockResolvedValue(tree)

    const result = await inviteMember('t1', 'bob@example.com', 'EDITOR')
    expect(result.error).toBe(false)
    expect(mockDb.treeAccess.create).toHaveBeenCalled()
    expect(sendTreeInvitationEmail).toHaveBeenCalled()
  })

  it('handles email sending failure gracefully', async () => {
    mockDb.user.findUnique
      .mockResolvedValueOnce({ id: 'user-2', email: 'bob@example.com', name: 'Bob' })
      .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com', name: 'Alice' })
    mockDb.treeAccess.findFirst.mockResolvedValue(null)
    mockDb.treeAccess.create.mockResolvedValue({})
    const tree = { id: 't1', name: 'My Tree', slug: 'my-tree', accesses: [] }
    mockDb.tree.findUnique.mockResolvedValue(tree)

    const mockSendEmail = sendTreeInvitationEmail as ReturnType<typeof vi.fn>
    mockSendEmail.mockRejectedValue(new Error('SMTP failure'))

    const result = await inviteMember('t1', 'bob@example.com', 'EDITOR')
    expect(result.error).toBe(false)
    expect(mockDb.treeAccess.create).toHaveBeenCalled()
  })
})

// ─── updateMember ────────────────────────────────────────
describe('updateMember', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await updateMember('t1', 'user-2', 'EDITOR')
    expect(result.error).toBe(true)
  })

  it('returns error when not admin', async () => {
    mockAssertRole.mockRejectedValue(new Error('error-no-permission'))
    const result = await updateMember('t1', 'user-2', 'EDITOR')
    expect(result).toEqual({ error: true, message: 'error-no-permission' })
  })

  it('updates member role successfully', async () => {
    mockDb.treeAccess.update.mockResolvedValue({})
    mockDb.tree.findUnique.mockResolvedValue({ id: 't1', accesses: [] })
    const result = await updateMember('t1', 'user-2', 'EDITOR')
    expect(result.error).toBe(false)
    expect(mockDb.treeAccess.update).toHaveBeenCalledWith({
      where: { treeId_userId: { treeId: 't1', userId: 'user-2' } },
      data: { role: 'EDITOR' },
    })
  })
})

// ─── removeMember ────────────────────────────────────────
describe('removeMember', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await removeMember('t1', 'user-2')
    expect(result.error).toBe(true)
  })

  it('returns error when not admin', async () => {
    mockAssertRole.mockRejectedValue(new Error('error-no-permission'))
    const result = await removeMember('t1', 'user-2')
    expect(result).toEqual({ error: true, message: 'error-no-permission' })
  })

  it('removes member successfully', async () => {
    mockDb.treeAccess.delete.mockResolvedValue({})
    mockDb.tree.findUnique.mockResolvedValue({ id: 't1', accesses: [] })
    const result = await removeMember('t1', 'user-2')
    expect(result.error).toBe(false)
    expect(mockDb.treeAccess.delete).toHaveBeenCalledWith({
      where: { treeId_userId: { treeId: 't1', userId: 'user-2' } },
    })
  })
})

// ─── createTreeNode ──────────────────────────────────────
describe('createTreeNode', () => {
  const values = { treeId: 't1', fullName: 'John Doe', gender: 'MALE' as const }

  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await createTreeNode(values)
    expect(result.error).toBe(true)
  })

  it('returns error when no permission', async () => {
    mockAssertRole.mockRejectedValue(new Error('error-no-permission'))
    const result = await createTreeNode(values)
    expect(result).toEqual({ error: true, message: 'error-no-permission' })
  })

  it('creates node and activity log', async () => {
    const node = { id: 'n1', treeId: 't1', fullName: 'John Doe', edgesFrom: [], edgesTo: [] }
    mockDb.treeNode.create.mockResolvedValue(node)
    mockDb.activityLog.create.mockResolvedValue({})
    const result = await createTreeNode(values)
    expect(result.error).toBe(false)
    expect(mockDb.treeNode.create).toHaveBeenCalled()
    expect(mockDb.activityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'NODE_CREATED', entityId: 'n1' }),
      })
    )
  })
})

// ─── updateTreeNode ──────────────────────────────────────
describe('updateTreeNode', () => {
  const values = { id: 'n1', treeId: 't1', fullName: 'Jane Doe', gender: 'FEMALE' as const }

  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await updateTreeNode(values)
    expect(result.error).toBe(true)
  })

  it('returns error when node not found', async () => {
    mockDb.treeNode.findFirst.mockResolvedValue(null)
    const result = await updateTreeNode(values)
    expect(result).toEqual({ error: true, message: 'error-node-not-found' })
  })

  it('updates node successfully', async () => {
    const prevNode = { id: 'n1', fullName: 'John Doe', gender: 'MALE' }
    mockDb.treeNode.findFirst.mockResolvedValue(prevNode)
    mockDb.treeNode.update.mockResolvedValue({})
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await updateTreeNode(values)
    expect(result.error).toBe(false)
    expect(mockDb.treeNode.update).toHaveBeenCalled()
  })
})

// ─── createTreeEdge ──────────────────────────────────────
describe('createTreeEdge', () => {
  const values = { treeId: 't1', fromNodeId: 'n1', toNodeId: 'n2', type: 'PARENT' as const }

  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await createTreeEdge(values)
    expect(result.error).toBe(true)
  })

  it('rejects self-loop', async () => {
    const selfLoop = { ...values, toNodeId: 'n1' }
    const result = await createTreeEdge(selfLoop)
    expect(result).toEqual({ error: true, message: 'error-cannot-connect-to-self' })
  })

  it('returns error when nodes not found', async () => {
    mockDb.treeNode.findFirst.mockResolvedValue(null)
    const result = await createTreeEdge(values)
    expect(result).toEqual({ error: true, message: 'error-nodes-not-found' })
  })

  it('returns error on duplicate edge', async () => {
    mockDb.treeNode.findFirst
      .mockResolvedValueOnce({ id: 'n1', fullName: 'A' })
      .mockResolvedValueOnce({ id: 'n2', fullName: 'B' })
    mockDb.treeEdge.findFirst.mockResolvedValue({ id: 'existing' })
    const result = await createTreeEdge(values)
    expect(result).toEqual({ error: true, message: 'error-relationship-already-exists' })
  })

  it('creates edge successfully', async () => {
    mockDb.treeNode.findFirst
      .mockResolvedValueOnce({ id: 'n1', fullName: 'A' })
      .mockResolvedValueOnce({ id: 'n2', fullName: 'B' })
    mockDb.treeEdge.findFirst.mockResolvedValue(null)
    mockDb.treeEdge.create.mockResolvedValue({ id: 'e1' })
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await createTreeEdge(values)
    expect(result.error).toBe(false)
    expect(mockDb.treeEdge.create).toHaveBeenCalled()
    expect(mockDb.activityLog.create).toHaveBeenCalled()
  })
})

// ─── deleteTreeNode ──────────────────────────────────────
describe('deleteTreeNode', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await deleteTreeNode('n1', 't1')
    expect(result.error).toBe(true)
  })

  it('returns error when node not found', async () => {
    mockDb.treeNode.findFirst.mockResolvedValue(null)
    const result = await deleteTreeNode('n1', 't1')
    expect(result).toEqual({ error: true, message: 'error-nodes-not-found' })
  })

  it('deletes node with edges and orphaned pictures', async () => {
    mockDb.treeNode.findFirst.mockResolvedValue({ id: 'n1', fullName: 'John' })
    mockDb.treeEdge.findMany.mockResolvedValue([{ id: 'e1' }])
    mockDb.treeEdge.deleteMany.mockResolvedValue({})
    mockDb.picture.findMany.mockResolvedValue([{ id: 'p1', fileKey: 'key1' }])
    mockDb.pictureTag.deleteMany.mockResolvedValue({})
    mockDb.picture.deleteMany.mockResolvedValue({})
    mockDb.treeNode.delete.mockResolvedValue({})
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await deleteTreeNode('n1', 't1')
    expect(result.error).toBe(false)
    expect(mockDb.treeEdge.deleteMany).toHaveBeenCalled()
    expect(mockDb.picture.deleteMany).toHaveBeenCalled()
    expect(mockDb.treeNode.delete).toHaveBeenCalledWith({ where: { id: 'n1' } })
  })

  it('logs S3 cleanup failure to Sentry', async () => {
    mockDb.treeNode.findFirst.mockResolvedValue({ id: 'n1', fullName: 'John' })
    mockDb.treeEdge.findMany.mockResolvedValue([])
    mockDb.picture.findMany.mockResolvedValue([{ id: 'p1', fileKey: 'key1' }])
    mockDb.pictureTag.deleteMany.mockResolvedValue({})
    mockDb.picture.deleteMany.mockResolvedValue({})
    mockDb.treeNode.delete.mockResolvedValue({})
    mockDb.activityLog.create.mockResolvedValue({})

    const s3Error = new Error('S3 delete failed')
    ;(deleteFileFromS3 as ReturnType<typeof vi.fn>).mockRejectedValue(s3Error)

    const result = await deleteTreeNode('n1', 't1')
    expect(result.error).toBe(false)
    expect(Sentry.captureException).toHaveBeenCalledWith(s3Error, expect.objectContaining({
      level: 'warning',
      tags: expect.objectContaining({ action: 'deleteTreeNode', step: 's3-cleanup' }),
    }))
    expect(mockDb.treeNode.delete).toHaveBeenCalledWith({ where: { id: 'n1' } })
  })
})

// ─── deleteTreeEdge ──────────────────────────────────────
describe('deleteTreeEdge', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await deleteTreeEdge('e1', 't1')
    expect(result.error).toBe(true)
  })

  it('returns error when edge not found', async () => {
    mockDb.treeEdge.findFirst.mockResolvedValue(null)
    const result = await deleteTreeEdge('e1', 't1')
    expect(result).toEqual({ error: true, message: 'error-edge-not-found' })
  })

  it('deletes edge successfully', async () => {
    mockDb.treeEdge.findFirst.mockResolvedValue({ id: 'e1', fromNodeId: 'n1', toNodeId: 'n2', type: 'PARENT' })
    mockDb.treeNode.findFirst
      .mockResolvedValueOnce({ id: 'n1', fullName: 'A' })
      .mockResolvedValueOnce({ id: 'n2', fullName: 'B' })
    mockDb.treeEdge.delete.mockResolvedValue({})
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await deleteTreeEdge('e1', 't1')
    expect(result.error).toBe(false)
    expect(mockDb.treeEdge.delete).toHaveBeenCalledWith({ where: { id: 'e1' } })
  })
})

// ─── getTreeNodes ────────────────────────────────────────
describe('getTreeNodes', () => {
  it('returns empty on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await getTreeNodes('t1')
    expect(result).toEqual([])
  })

  it('returns empty when no access', async () => {
    mockDb.treeAccess.findFirst.mockResolvedValue(null)
    const result = await getTreeNodes('t1')
    expect(result).toEqual([])
  })

  it('returns nodes when user has access', async () => {
    mockDb.treeAccess.findFirst.mockResolvedValue({ id: 'a1' })
    const nodes = [{ id: 'n1', fullName: 'John' }]
    mockDb.treeNode.findMany.mockResolvedValue(nodes)
    const result = await getTreeNodes('t1')
    expect(result).toEqual(nodes)
  })
})

// ─── getTimelineEvents ──────────────────────────────────
describe('getTimelineEvents', () => {
  it('returns empty on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await getTimelineEvents('my-tree')
    expect(result).toEqual([])
  })

  it('returns empty when tree not found', async () => {
    mockDb.tree.findFirst.mockResolvedValue(null)
    const result = await getTimelineEvents('my-tree')
    expect(result).toEqual([])
  })

  it('returns sorted timeline events', async () => {
    const birthDate = new Date('1990-01-15')
    const deathDate = new Date('2020-06-10')
    mockDb.tree.findFirst.mockResolvedValue({
      nodes: [
        {
          id: 'n1',
          fullName: 'John',
          birthDate,
          deathDate,
          birthPlace: 'NYC',
          deathPlace: 'LA',
          taggedIn: [],
        },
      ],
    })

    const result = await getTimelineEvents('my-tree')
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('birth')
    expect(result[1].type).toBe('death')
    expect(result[0].date.getTime()).toBeLessThan(result[1].date.getTime())
  })
})
