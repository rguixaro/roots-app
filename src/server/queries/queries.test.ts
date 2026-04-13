import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react', () => ({ cache: (fn: any) => fn }))
vi.mock('@/server/utils/auth', () => ({ assertAuthenticated: vi.fn() }))
vi.mock('@/server/db', () => ({
  db: {
    tree: { findMany: vi.fn(), findFirst: vi.fn() },
    treeNode: { findMany: vi.fn() },
    treeEdge: { findMany: vi.fn() },
    activityLog: { findMany: vi.fn() },
  },
}))

import { db } from '@/server/db'
import { assertAuthenticated } from '@/server/utils/auth'
import { getTrees, getTree, getTreeRoots, getTreeActivityLogs } from './index'

const mockDb = db as any
const mockAssertAuth = assertAuthenticated as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockAssertAuth.mockResolvedValue('user-1')
})

// ─── getTrees ───────────────────────────────────────────
describe('getTrees', () => {
  it('returns trees for authenticated user', async () => {
    const trees = [
      { id: 't1', name: 'Family', slug: 'family', accesses: [] },
      { id: 't2', name: 'Friends', slug: 'friends', accesses: [] },
    ]
    mockDb.tree.findMany.mockResolvedValue(trees)

    const result = await getTrees()
    expect(result).toEqual({ trees })
    expect(mockDb.tree.findMany).toHaveBeenCalledWith({
      where: { accesses: { some: { userId: 'user-1' } } },
      include: { accesses: true },
    })
  })

  it('throws on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    await expect(getTrees()).rejects.toThrow('unauthenticated')
  })
})

// ─── getTree ────────────────────────────────────────────
describe('getTree', () => {
  it('returns tree by slug with user access', async () => {
    const tree = {
      id: 't1',
      name: 'Family',
      slug: 'family',
      accesses: [{ user: { id: 'user-1', name: 'Alice', email: 'alice@example.com', image: null } }],
    }
    mockDb.tree.findFirst.mockResolvedValue(tree)

    const result = await getTree('family')
    expect(result).toEqual(tree)
    expect(mockDb.tree.findFirst).toHaveBeenCalledWith({
      where: { slug: 'family', accesses: { some: { userId: 'user-1' } } },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })
  })

  it('returns null when not found', async () => {
    mockDb.tree.findFirst.mockResolvedValue(null)

    const result = await getTree('nonexistent')
    expect(result).toBeNull()
  })
})

// ─── getTreeRoots ───────────────────────────────────────
describe('getTreeRoots', () => {
  it('returns tree + nodes + edges', async () => {
    const tree = {
      id: 't1',
      name: 'Family',
      slug: 'family',
      accesses: [],
    }
    const nodes = [
      {
        id: 'n1',
        fullName: 'Alice',
        birthDate: null,
        taggedIn: [
          {
            isProfile: true,
            picture: { fileKey: 'pic.jpg', metadata: { width: 100, height: 100 } },
          },
        ],
      },
    ]
    const edges = [{ id: 'e1', fromNodeId: 'n1', toNodeId: 'n2', type: 'PARENT' }]

    mockDb.tree.findFirst.mockResolvedValue(tree)
    mockDb.treeNode.findMany.mockResolvedValue(nodes)
    mockDb.treeEdge.findMany.mockResolvedValue(edges)

    const result = await getTreeRoots('family')
    expect(result).toHaveProperty('tree', tree)
    expect(result).toHaveProperty('edges', edges)
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].fullName).toBe('Alice')
  })

  it('returns error when tree not found', async () => {
    mockDb.tree.findFirst.mockResolvedValue(null)

    const result = await getTreeRoots('nonexistent')
    expect(result).toEqual({ error: true, message: 'error-tree-not-found' })
  })
})

// ─── getTreeActivityLogs ────────────────────────────────
describe('getTreeActivityLogs', () => {
  it('returns logs for tree user has access to', async () => {
    const logs = [
      {
        id: 'log1',
        action: 'NODE_CREATED',
        tree: { id: 't1', name: 'Family' },
        user: { id: 'user-1', name: 'Alice', image: null },
        createdAt: new Date('2026-04-10'),
      },
      {
        id: 'log2',
        action: 'TREE_UPDATED',
        tree: { id: 't1', name: 'Family' },
        user: { id: 'user-1', name: 'Alice', image: null },
        createdAt: new Date('2026-04-09'),
      },
    ]
    mockDb.activityLog.findMany.mockResolvedValue(logs)

    const result = await getTreeActivityLogs('family')
    expect(result).toEqual({ logs })
    expect(mockDb.activityLog.findMany).toHaveBeenCalledWith({
      where: { tree: { slug: 'family', accesses: { some: { userId: 'user-1' } } } },
      include: {
        tree: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('throws on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    await expect(getTreeActivityLogs('family')).rejects.toThrow('unauthenticated')
  })
})
