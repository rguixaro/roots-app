import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/server/db', () => ({
  db: {
    tree: { findMany: vi.fn(), findFirst: vi.fn() },
    picture: { findMany: vi.fn() },
    activityLog: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    user: { findMany: vi.fn() },
  },
}))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/auth', () => ({ auth: vi.fn(), signOut: vi.fn() }))
vi.mock('@/server/utils', () => ({
  assertAuthenticated: vi.fn(),
  assertRole: vi.fn(),
  slugify: vi.fn(),
  getChanges: vi.fn(),
  checkTreeAccess: vi.fn(),
  getUserById: vi.fn(),
  getAccountByUserId: vi.fn(),
  calculateDaysUntil: (date: Date, options?: { ignoreYear?: boolean }) => {
    const today = new Date()
    if (options?.ignoreYear) {
      let targetDate = new Date(today.getFullYear(), date.getMonth(), date.getDate())
      if (date.getMonth() === 1 && date.getDate() === 29 && targetDate.getMonth() !== 1) {
        targetDate = new Date(today.getFullYear(), 1, 28)
      }
      if (targetDate < today) targetDate.setFullYear(today.getFullYear() + 1)
      return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  },
  isInCurrentWeekOfYear: (date: Date) => {
    const today = new Date()
    let targetDate = new Date(today.getFullYear(), date.getMonth(), date.getDate())
    if (date.getMonth() === 1 && date.getDate() === 29 && targetDate.getMonth() !== 1) {
      targetDate = new Date(today.getFullYear(), 1, 28)
    }
    const currentWeekStart = new Date(today)
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentWeekStart.setDate(today.getDate() - mondayOffset)
    currentWeekStart.setHours(0, 0, 0, 0)
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
    currentWeekEnd.setHours(23, 59, 59, 999)
    return targetDate >= currentWeekStart && targetDate <= currentWeekEnd
  },
}))

import { db } from '@/server/db'
import { assertAuthenticated } from '@/server/utils'
import { getMilestones, getHighlights, getTreeInfo } from './insights'

const mockDb = db as any
const mockAssertAuth = assertAuthenticated as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 3, 13, 0, 0, 0))
  vi.clearAllMocks()
  mockAssertAuth.mockResolvedValue('user-1')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getMilestones', () => {
  it('returns empty arrays on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await getMilestones()
    expect(result).toEqual({ birthdays: [], anniversaries: [], memories: [] })
  })

  it('returns empty arrays when user has no trees', async () => {
    mockDb.tree.findMany.mockResolvedValue([])
    const result = await getMilestones()
    expect(result).toEqual({ birthdays: [], anniversaries: [], memories: [] })
  })

  it('includes birthdays within 30 days with correct age', async () => {
    const birthDate = new Date(1990, 4, 1)
    mockDb.tree.findMany.mockResolvedValue([
      {
        name: 'Family',
        slug: 'family',
        nodes: [
          {
            id: 'n1',
            fullName: 'Alice',
            treeId: 't1',
            birthDate,
            deathDate: null,
            taggedIn: [],
          },
        ],
      },
    ])

    const result = await getMilestones()
    expect(result.birthdays).toHaveLength(1)
    expect(result.birthdays[0].name).toBe('Alice')
    expect(result.birthdays[0].age).toBe(36)
    expect(result.birthdays[0].daysUntil).toBe(18)
  })

  it('does not include birthdays for deceased members', async () => {
    const birthDate = new Date(1950, 4, 1)
    const deathDate = new Date(2020, 0, 1)
    mockDb.tree.findMany.mockResolvedValue([
      {
        name: 'Family',
        slug: 'family',
        nodes: [
          {
            id: 'n1',
            fullName: 'Bob',
            treeId: 't1',
            birthDate,
            deathDate,
            taggedIn: [],
          },
        ],
      },
    ])

    const result = await getMilestones()
    expect(result.birthdays).toHaveLength(0)
    expect(result.anniversaries.length).toBeGreaterThanOrEqual(0)
  })

  it('handles Feb 29 birthday in non-leap year', async () => {
    vi.setSystemTime(new Date(2027, 1, 1, 0, 0, 0))

    const birthDate = new Date(1992, 1, 29)
    mockDb.tree.findMany.mockResolvedValue([
      {
        name: 'Family',
        slug: 'family',
        nodes: [
          {
            id: 'n1',
            fullName: 'LeapBaby',
            treeId: 't1',
            birthDate,
            deathDate: null,
            taggedIn: [],
          },
        ],
      },
    ])

    const result = await getMilestones()
    expect(result.birthdays).toHaveLength(1)
    expect(result.birthdays[0].name).toBe('LeapBaby')
    expect(result.birthdays[0].daysUntil).toBe(27)
  })

  it('returns death anniversaries within 30 days', async () => {
    const birthDate = new Date(1950, 0, 1)
    const deathDate = new Date(2020, 4, 5)
    mockDb.tree.findMany.mockResolvedValue([
      {
        name: 'Family',
        slug: 'family',
        nodes: [
          {
            id: 'n1',
            fullName: 'Grandpa',
            treeId: 't1',
            birthDate,
            deathDate,
            taggedIn: [],
          },
        ],
      },
    ])

    const result = await getMilestones()
    const deathAnniversaries = result.anniversaries.filter((a) => a.type === 'death')
    expect(deathAnniversaries).toHaveLength(1)
    expect(deathAnniversaries[0].name).toBe('Grandpa')
    expect(deathAnniversaries[0].yearsAgo).toBe(6)
  })

  it('returns weekly memories matching current week', async () => {
    const picDate = new Date(2023, 3, 14)
    mockDb.tree.findMany.mockResolvedValue([
      {
        name: 'Family',
        slug: 'family',
        nodes: [
          {
            id: 'n1',
            fullName: 'Alice',
            treeId: 't1',
            birthDate: null,
            deathDate: null,
            taggedIn: [
              {
                isProfile: false,
                picture: {
                  fileKey: 'memory.jpg',
                  date: picDate,
                  tags: [{ nodeId: 'n1' }],
                },
              },
            ],
          },
        ],
      },
    ])

    const result = await getMilestones()
    expect(result.memories).toHaveLength(1)
    expect(result.memories[0].picture).toBe('memory.jpg')
    expect(result.memories[0].yearsAgo).toBe(3)
  })
})

describe('getHighlights', () => {
  it('returns all null on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await getHighlights()
    expect(result).toEqual({
      oldest: null,
      youngest: null,
      largest: null,
      mostPhotos: null,
      mostMembers: null,
    })
  })

  it('returns correct oldest, youngest, largest, mostPhotos, mostMembers', async () => {
    mockDb.tree.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Family',
        slug: 'family',
        nodes: [
          {
            id: 'n1',
            fullName: 'Grandpa',
            birthDate: new Date('1930-01-01'),
            createdAt: new Date('2024-01-01'),
            taggedIn: [{ id: 'ti1', isProfile: true, picture: { fileKey: 'gp.jpg' } }],
            edgesFrom: [{ type: 'PARENT' }, { type: 'PARENT' }, { type: 'PARENT' }],
            edgesTo: [],
          },
          {
            id: 'n2',
            fullName: 'Baby',
            birthDate: new Date('2025-06-01'),
            createdAt: new Date('2026-03-01'),
            taggedIn: [
              { id: 'ti2', isProfile: false, picture: { fileKey: 'b1.jpg' } },
              { id: 'ti3', isProfile: false, picture: { fileKey: 'b2.jpg' } },
              { id: 'ti4', isProfile: false, picture: { fileKey: 'b3.jpg' } },
              { id: 'ti5', isProfile: false, picture: { fileKey: 'b4.jpg' } },
            ],
            edgesFrom: [],
            edgesTo: [{ type: 'PARENT' }],
          },
        ],
      },
    ])

    const result = await getHighlights()

    expect(result.oldest?.name).toBe('Grandpa')
    expect(result.oldest?.birthYear).toBe(1930)

    expect(result.youngest?.name).toBe('Baby')
    expect(result.youngest?.birthYear).toBe(2025)

    expect(result.largest?.name).toBe('Grandpa')
    expect(result.largest?.childrenCount).toBe(3)

    expect(result.mostPhotos?.name).toBe('Baby')
    expect(result.mostPhotos?.photoCount).toBe(4)

    expect(result.mostMembers?.name).toBe('Family')
    expect(result.mostMembers?.memberCount).toBe(2)
  })
})

type TreeInfoSuccess = Exclude<Awaited<ReturnType<typeof getTreeInfo>>, { error: true }>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeNode = (overrides: Partial<any> = {}) => ({
  id: overrides.id ?? 'n',
  fullName: overrides.fullName ?? 'Node',
  alias: null,
  gender: 'MALE' as const,
  birthDate: null as Date | null,
  birthPlace: null as string | null,
  deathDate: null as Date | null,
  deathPlace: null as string | null,
  biography: null as string | null,
  createdAt: new Date(),
  taggedIn: [] as unknown[],
  ...overrides,
})

const emptyTree = {
  id: 't1',
  slug: 'family',
  name: 'Family',
  type: 'HUMAN' as const,
  newsletter: true,
  createdAt: new Date(2026, 0, 1),
  updatedAt: new Date(2026, 0, 1),
  nodes: [] as ReturnType<typeof makeNode>[],
  TreeEdge: [] as Array<{ id: string; fromNodeId: string; toNodeId: string; type: string }>,
  accesses: [] as Array<{
    role: string
    createdAt: Date
    user: { id: string; name: string | null; email: string | null; image: string | null }
  }>,
}

const stubSecondaryQueries = () => {
  mockDb.picture.findMany.mockResolvedValue([])
  mockDb.activityLog.count.mockResolvedValue(0)
  mockDb.activityLog.findMany.mockResolvedValue([])
  mockDb.activityLog.groupBy.mockResolvedValue([])
  mockDb.user.findMany.mockResolvedValue([])
}

describe('getTreeInfo', () => {
  it('returns error when tree is not found', async () => {
    mockDb.tree.findFirst.mockResolvedValue(null)

    const result = await getTreeInfo('nope')
    expect(result).toEqual({ error: true, message: 'error-tree-not-found' })
  })

  it('returns a well-shaped TreeInfo for an empty tree', async () => {
    mockDb.tree.findFirst.mockResolvedValue(emptyTree)
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    expect('error' in result).toBe(false)
    const info = result as TreeInfoSuccess

    expect(info.overview).toEqual({
      totalMembers: 0,
      totalEdges: 0,
      totalPictures: 0,
      totalCollaborators: 0,
    })
    expect(info.generations.depth).toBe(0)
    expect(info.relationships.topFamilies).toEqual([])
    expect(info.lifeStats.topLongestLived).toEqual([])
    expect(info.places.topBirthPlaces).toEqual([])
    expect(info.pictures.mostPhotographed).toEqual([])
    expect(info.upcomingEvents.birthdays).toEqual([])
    expect(info.collaborators.list).toEqual([])
    expect(info.activity.totalLogs).toBe(0)
  })

  it('counts demographics: gender breakdown and living/deceased', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'n1', gender: 'MALE' }),
        makeNode({ id: 'n2', gender: 'FEMALE', deathDate: new Date(2020, 0, 1) }),
        makeNode({ id: 'n3', gender: 'OTHER' }),
        makeNode({ id: 'n4', gender: 'UNSPECIFIED', deathDate: new Date(2020, 0, 1) }),
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.demographics.genderBreakdown).toEqual({
      MALE: 1,
      FEMALE: 1,
      OTHER: 1,
      UNSPECIFIED: 1,
    })
    expect(info.demographics.livingCount).toBe(2)
    expect(info.demographics.deceasedCount).toBe(2)
    expect(info.demographics.withGender).toBe(3)
  })

  it('computes generation depth via longest PARENT chain', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'grandpa' }),
        makeNode({ id: 'parent' }),
        makeNode({ id: 'child' }),
      ],
      TreeEdge: [
        { id: 'e1', fromNodeId: 'grandpa', toNodeId: 'parent', type: 'PARENT' },
        { id: 'e2', fromNodeId: 'parent', toNodeId: 'child', type: 'PARENT' },
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess
    expect(info.generations.depth).toBe(3)
  })

  it('guards against cycles in parent edges (no infinite loop)', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [makeNode({ id: 'a' }), makeNode({ id: 'b' })],
      TreeEdge: [
        { id: 'e1', fromNodeId: 'a', toNodeId: 'b', type: 'PARENT' },
        { id: 'e2', fromNodeId: 'b', toNodeId: 'a', type: 'PARENT' },
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess
    expect(Number.isFinite(info.generations.depth)).toBe(true)
    expect(info.generations.depth).toBeGreaterThan(0)
  })

  it('returns topFamilies sorted by children count desc, capped at 5', async () => {
    const parents = [1, 2, 3, 4, 5, 6].map((i) =>
      makeNode({ id: `p${i}`, fullName: `Parent${i}` })
    )
    const kids = Array.from({ length: 21 }, (_, i) =>
      makeNode({ id: `k${i}`, fullName: `Kid${i}`, gender: 'FEMALE' })
    )
    const edges: Array<{
      id: string
      fromNodeId: string
      toNodeId: string
      type: string
    }> = []
    let kidIdx = 0
    parents.forEach((p, i) => {
      for (let j = 0; j < i + 1; j++) {
        edges.push({
          id: `e-${p.id}-${kidIdx}`,
          fromNodeId: p.id,
          toNodeId: kids[kidIdx].id,
          type: 'PARENT',
        })
        kidIdx++
      }
    })
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [...parents, ...kids],
      TreeEdge: edges,
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.relationships.topFamilies).toHaveLength(5)
    expect(info.relationships.topFamilies.map((f) => f.childrenCount)).toEqual([
      6, 5, 4, 3, 2,
    ])
    expect(info.relationships.largestFamily?.name).toBe('Parent6')
  })

  it('returns topLongestLived sorted by ageAtDeath desc, capped at 5', async () => {
    const nodes = [90, 85, 80, 75, 70, 65].map((yearsApart, i) =>
      makeNode({
        id: `n${i}`,
        fullName: `M${yearsApart}`,
        gender: 'FEMALE',
        birthDate: new Date(1900, 0, 1),
        deathDate: new Date(1900 + yearsApart, 0, 1),
      })
    )
    mockDb.tree.findFirst.mockResolvedValue({ ...emptyTree, nodes })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.lifeStats.topLongestLived).toHaveLength(5)
    const ages = info.lifeStats.topLongestLived.map((m) => m.ageAtDeath)
    expect(ages).toEqual([...ages].sort((a, b) => b - a))
    expect(ages[0]).toBeGreaterThanOrEqual(88)
    expect(ages[4]).toBeGreaterThanOrEqual(68)
    expect(info.lifeStats.longestLived?.ageAtDeath).toBe(ages[0])
  })

  it('dedups places case-insensitively and keeps first-seen casing', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'n1', birthPlace: 'Paris' }),
        makeNode({ id: 'n2', birthPlace: 'paris' }),
        makeNode({ id: 'n3', birthPlace: 'PARIS' }),
        makeNode({ id: 'n4', birthPlace: 'Barcelona' }),
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.places.uniqueBirthPlaces).toBe(2)
    expect(info.places.topBirthPlaces).toEqual([
      { place: 'Paris', count: 3 },
      { place: 'Barcelona', count: 1 },
    ])
  })

  it('counts most photographed members and untagged people', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'n1', fullName: 'A' }),
        makeNode({ id: 'n2', fullName: 'B' }),
        makeNode({ id: 'n3', fullName: 'C' }),
      ],
    })
    mockDb.picture.findMany.mockResolvedValue([
      {
        id: 'p1',
        fileKey: 'a.jpg',
        date: null,
        metadata: null,
        createdAt: new Date(),
        tags: [{ nodeId: 'n1' }],
      },
      {
        id: 'p2',
        fileKey: 'b.jpg',
        date: null,
        metadata: null,
        createdAt: new Date(),
        tags: [{ nodeId: 'n1' }, { nodeId: 'n2' }],
      },
      {
        id: 'p3',
        fileKey: 'c.jpg',
        date: null,
        metadata: null,
        createdAt: new Date(),
        tags: [{ nodeId: 'n1' }],
      },
    ])
    mockDb.activityLog.count.mockResolvedValue(0)
    mockDb.activityLog.findMany.mockResolvedValue([])
    mockDb.activityLog.groupBy.mockResolvedValue([])
    mockDb.user.findMany.mockResolvedValue([])

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.pictures.total).toBe(3)
    expect(info.pictures.mostPhotographed).toHaveLength(2)
    expect(info.pictures.mostPhotographed[0].name).toBe('A')
    expect(info.pictures.mostPhotographed[0].photoCount).toBe(3)
    expect(info.pictures.untaggedPeople).toBe(1)
  })

  it('counts pictures with GPS metadata', async () => {
    mockDb.tree.findFirst.mockResolvedValue(emptyTree)
    mockDb.picture.findMany.mockResolvedValue([
      {
        id: 'p1',
        fileKey: 'a.jpg',
        date: null,
        metadata: { gps: { lat: 1, lng: 2 } },
        createdAt: new Date(),
        tags: [],
      },
      {
        id: 'p2',
        fileKey: 'b.jpg',
        date: null,
        metadata: null,
        createdAt: new Date(),
        tags: [],
      },
      {
        id: 'p3',
        fileKey: 'c.jpg',
        date: null,
        metadata: { gps: { lat: 3, lng: 4 } },
        createdAt: new Date(),
        tags: [],
      },
    ])
    mockDb.activityLog.count.mockResolvedValue(0)
    mockDb.activityLog.findMany.mockResolvedValue([])
    mockDb.activityLog.groupBy.mockResolvedValue([])
    mockDb.user.findMany.mockResolvedValue([])

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess
    expect(info.pictures.withGps).toBe(2)
  })

  it('includes upcoming birthdays within 30 days', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({
          id: 'n1',
          fullName: 'Alice',
          gender: 'FEMALE',
          birthDate: new Date(1990, 4, 1),
        }),
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.upcomingEvents.birthdays).toHaveLength(1)
    expect(info.upcomingEvents.birthdays[0].name).toBe('Alice')
    expect(info.upcomingEvents.birthdays[0].age).toBe(36)
  })

  it('returns collaborators list and byRole counts', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      accesses: [
        {
          role: 'ADMIN',
          createdAt: new Date(),
          user: { id: 'u1', name: 'Admin', email: 'a@x', image: null },
        },
        {
          role: 'EDITOR',
          createdAt: new Date(),
          user: { id: 'u2', name: 'Editor', email: 'e@x', image: null },
        },
        {
          role: 'VIEWER',
          createdAt: new Date(),
          user: { id: 'u3', name: 'V1', email: 'v1@x', image: null },
        },
        {
          role: 'VIEWER',
          createdAt: new Date(),
          user: { id: 'u4', name: 'V2', email: 'v2@x', image: null },
        },
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.collaborators.byRole).toEqual({ ADMIN: 1, EDITOR: 1, VIEWER: 2 })
    expect(info.collaborators.list).toHaveLength(4)
    expect(info.overview.totalCollaborators).toBe(4)
  })

  it('aggregates activity: totalLogs, actionBreakdown, topContributors', async () => {
    mockDb.tree.findFirst.mockResolvedValue(emptyTree)
    mockDb.picture.findMany.mockResolvedValue([])
    mockDb.activityLog.count.mockResolvedValue(12)
    mockDb.activityLog.findMany.mockResolvedValue([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDb.activityLog.groupBy.mockImplementation((args: any) => {
      if (args.by?.[0] === 'action') {
        return Promise.resolve([
          { action: 'NODE_CREATED', _count: 5 },
          { action: 'EDGE_CREATED', _count: 4 },
          { action: 'PICTURE_ADDED', _count: 3 },
        ])
      }
      if (args.by?.[0] === 'createdBy') {
        return Promise.resolve([
          { createdBy: 'u1', _count: 8 },
          { createdBy: 'u2', _count: 4 },
        ])
      }
      return Promise.resolve([])
    })
    mockDb.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Alice', image: null },
      { id: 'u2', name: 'Bob', image: null },
    ])

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.activity.totalLogs).toBe(12)
    expect(info.activity.actionBreakdown.NODE_CREATED).toBe(5)
    expect(info.activity.actionBreakdown.EDGE_CREATED).toBe(4)
    expect(info.activity.actionBreakdown.PICTURE_ADDED).toBe(3)
    expect(info.activity.actionBreakdown.NODE_UPDATED).toBe(0)

    expect(info.activity.topContributors).toHaveLength(2)
    expect(info.activity.topContributors[0]).toEqual({
      userId: 'u1',
      name: 'Alice',
      image: null,
      count: 8,
    })
  })

  it('computes average ages for living and deceased members', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'l1', fullName: 'L1', birthDate: new Date(1986, 0, 1) }),
        makeNode({ id: 'l2', fullName: 'L2', birthDate: new Date(1996, 0, 1) }),
        makeNode({
          id: 'd1',
          fullName: 'D1',
          birthDate: new Date(1900, 0, 1),
          deathDate: new Date(1980, 0, 1),
        }),
        makeNode({
          id: 'd2',
          fullName: 'D2',
          birthDate: new Date(1920, 0, 1),
          deathDate: new Date(1990, 0, 1),
        }),
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.demographics.avgAgeLiving).not.toBeNull()
    expect(info.demographics.avgAgeLiving!).toBeGreaterThan(33)
    expect(info.demographics.avgAgeLiving!).toBeLessThan(37)

    expect(info.demographics.avgAgeAtDeath).not.toBeNull()
    expect(info.demographics.avgAgeAtDeath!).toBeGreaterThan(73)
    expect(info.demographics.avgAgeAtDeath!).toBeLessThan(77)
  })

  it('computes generation span years (youngest − oldest birth year)', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'n1', birthDate: new Date(1920, 5, 1) }),
        makeNode({ id: 'n2', birthDate: new Date(2005, 5, 1) }),
        makeNode({ id: 'n3', birthDate: new Date(1970, 5, 1) }),
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.generations.spanYears).toBe(85)
    expect(info.generations.oldestMember?.name).toBeDefined()
    expect(info.generations.youngestMember?.name).toBeDefined()
  })

  it('counts completeness fields per member', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({
          id: 'n1',
          gender: 'MALE',
          birthDate: new Date(1970, 0, 1),
          birthPlace: 'Paris',
          biography: 'A life',
          taggedIn: [{ isProfile: true, picture: { fileKey: 'p1.jpg' } }],
        }),
        makeNode({
          id: 'n2',
          gender: 'UNSPECIFIED',
          birthDate: null,
          birthPlace: '   ',
          biography: '',
          deathDate: new Date(2020, 0, 1),
        }),
        makeNode({
          id: 'n3',
          gender: 'FEMALE',
          birthDate: new Date(1980, 0, 1),
          birthPlace: 'Barcelona',
        }),
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess
    const d = info.demographics

    expect(d.withBirthDate).toBe(2)
    expect(d.withDeathDate).toBe(1)
    expect(d.withBiography).toBe(1)
    expect(d.withBirthPlace).toBe(2)
    expect(d.withProfilePicture).toBe(1)
    expect(d.withGender).toBe(2)
  })

  it('counts isolated nodes (members with no edges)', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'connected-a' }),
        makeNode({ id: 'connected-b' }),
        makeNode({ id: 'loner-1' }),
        makeNode({ id: 'loner-2' }),
      ],
      TreeEdge: [
        {
          id: 'e1',
          fromNodeId: 'connected-a',
          toNodeId: 'connected-b',
          type: 'SPOUSE',
        },
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess
    expect(info.relationships.isolatedNodes).toBe(2)
  })

  it('returns null for age/family/member stats when no qualifying data exists', async () => {
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [
        makeNode({ id: 'n1', gender: 'MALE' }),
      ],
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess

    expect(info.demographics.avgAgeLiving).toBeNull()
    expect(info.demographics.avgAgeAtDeath).toBeNull()
    expect(info.generations.oldestMember).toBeNull()
    expect(info.generations.youngestMember).toBeNull()
    expect(info.generations.spanYears).toBeNull()
    expect(info.lifeStats.longestLived).toBeNull()
    expect(info.relationships.largestFamily).toBeNull()
    expect(info.relationships.avgChildrenPerParent).toBeNull()
    expect(info.pictures.earliestDate).toBeNull()
  })

  it('computes avgChildrenPerParent from PARENT edges', async () => {
    const parents = ['p1', 'p2', 'p3'].map((id) =>
      makeNode({ id, fullName: id.toUpperCase() })
    )
    const kids = Array.from({ length: 12 }, (_, i) =>
      makeNode({ id: `k${i}`, gender: 'FEMALE' })
    )
    const counts = [2, 4, 6]
    const edges: Array<{
      id: string
      fromNodeId: string
      toNodeId: string
      type: string
    }> = []
    let kidIdx = 0
    parents.forEach((p, pi) => {
      for (let j = 0; j < counts[pi]; j++) {
        edges.push({
          id: `e-${p.id}-${kidIdx}`,
          fromNodeId: p.id,
          toNodeId: kids[kidIdx].id,
          type: 'PARENT',
        })
        kidIdx++
      }
    })
    mockDb.tree.findFirst.mockResolvedValue({
      ...emptyTree,
      nodes: [...parents, ...kids],
      TreeEdge: edges,
    })
    stubSecondaryQueries()

    const result = await getTreeInfo('family')
    const info = result as TreeInfoSuccess
    expect(info.relationships.avgChildrenPerParent).toBe(4)
  })
})
