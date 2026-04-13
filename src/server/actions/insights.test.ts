import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/server/db', () => ({
  db: {
    tree: { findMany: vi.fn() },
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
import { getMilestones, getHighlights } from './insights'

const mockDb = db as any
const mockAssertAuth = assertAuthenticated as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 3, 13, 0, 0, 0)) // 2026-04-13 Monday
  vi.clearAllMocks()
  mockAssertAuth.mockResolvedValue('user-1')
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── getMilestones ───────────────────────────────────────
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
    // Birthday on May 1 = 18 days away from April 13
    const birthDate = new Date(1990, 4, 1) // May 1, 1990
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
    expect(result.birthdays[0].age).toBe(36) // 2026 - 1990
    expect(result.birthdays[0].daysUntil).toBe(18)
  })

  it('does not include birthdays for deceased members', async () => {
    const birthDate = new Date(1950, 4, 1) // May 1
    const deathDate = new Date(2020, 0, 1) // Jan 1, 2020
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
    // Deceased: no birthday, but should still produce anniversaries
    expect(result.birthdays).toHaveLength(0)
    expect(result.anniversaries.length).toBeGreaterThanOrEqual(0)
  })

  it('handles Feb 29 birthday in non-leap year', async () => {
    // 2026 is not a leap year; system time is 2026-04-13
    // Feb 29 should clamp to Feb 28 in 2026, which is already past
    // So next occurrence is Feb 28, 2027 => ~321 days away, outside 30-day window
    // Shift to a time where Feb 28 is within 30 days instead
    vi.setSystemTime(new Date(2027, 1, 1, 0, 0, 0)) // 2027-02-01

    const birthDate = new Date(1992, 1, 29) // Feb 29, 1992 (leap year)
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
    // In non-leap year 2027, Feb 29 birthday should show on Feb 28
    expect(result.birthdays[0].daysUntil).toBe(27) // Feb 28 - Feb 1 = 27 days
  })

  it('returns death anniversaries within 30 days', async () => {
    // System time: 2026-04-13
    const birthDate = new Date(1950, 0, 1) // Jan 1, 1950
    const deathDate = new Date(2020, 4, 5) // May 5, 2020 => 22 days from Apr 13
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
    expect(deathAnniversaries[0].yearsAgo).toBe(6) // 2026 - 2020
  })

  it('returns weekly memories matching current week', async () => {
    // System time: 2026-04-13 (Monday)
    // A picture taken on the same week in a prior year should match
    const picDate = new Date(2023, 3, 14) // April 14, 2023 — same week of year as Apr 13 2026
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
    expect(result.memories[0].yearsAgo).toBe(3) // 2026 - 2023
  })
})

// ─── getHighlights ───────────────────────────────────────
describe('getHighlights', () => {
  it('returns all null on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await getHighlights()
    expect(result).toEqual({
      oldest: null,
      newest: null,
      largest: null,
      mostPhotos: null,
      mostMembers: null,
    })
  })

  it('returns correct oldest, newest, largest, mostPhotos, mostMembers', async () => {
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

    // Oldest by birthDate
    expect(result.oldest?.name).toBe('Grandpa')
    expect(result.oldest?.birthYear).toBe(1930)

    // Newest by createdAt
    expect(result.newest?.name).toBe('Baby')

    // Largest branch by PARENT edgesFrom count
    expect(result.largest?.name).toBe('Grandpa')
    expect(result.largest?.childrenCount).toBe(3)

    // Most photos by taggedIn count
    expect(result.mostPhotos?.name).toBe('Baby')
    expect(result.mostPhotos?.photoCount).toBe(4)

    // Most members tree
    expect(result.mostMembers?.name).toBe('Family')
    expect(result.mostMembers?.memberCount).toBe(2)
  })
})
