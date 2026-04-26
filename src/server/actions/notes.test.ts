import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/db', () => ({
  db: {
    tree: { findUnique: vi.fn() },
    treeAccess: { findFirst: vi.fn() },
    treeNote: { upsert: vi.fn() },
    activityLog: { create: vi.fn(), findFirst: vi.fn() },
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/auth', () => ({ auth: vi.fn(), signOut: vi.fn() }))
vi.mock('@/server/utils', () => ({
  assertAuthenticated: vi.fn(),
  assertRole: vi.fn(),
  assertTreeWritable: vi.fn(),
}))

import { db } from '@/server/db'
import { assertAuthenticated, assertRole, assertTreeWritable } from '@/server/utils'
import { updateTreeNote } from './notes'
import { MAX_TREE_NOTE_LENGTH } from '@/server/schemas'

const mockDb = db as any
const mockAssertAuth = assertAuthenticated as ReturnType<typeof vi.fn>
const mockAssertRole = assertRole as ReturnType<typeof vi.fn>
const mockAssertTreeWritable = assertTreeWritable as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockAssertAuth.mockResolvedValue('user-1')
  mockAssertRole.mockResolvedValue(undefined)
  mockAssertTreeWritable.mockResolvedValue(undefined)
  mockDb.tree.findUnique.mockResolvedValue({ id: 't1', slug: 'family' })
  mockDb.activityLog.findFirst.mockResolvedValue(null)
  mockDb.treeNote.upsert.mockResolvedValue({ id: 'n1', treeId: 't1', content: 'hello' })
})

describe('updateTreeNote', () => {
  it('upserts the note on valid input and writes an activity log', async () => {
    const result = await updateTreeNote({ treeId: 't1', content: 'hello world' })

    expect(result).toEqual({ error: false })
    expect(mockAssertRole).toHaveBeenCalledWith('t1', 'user-1', ['EDITOR', 'ADMIN'])
    expect(mockDb.treeNote.upsert).toHaveBeenCalledWith({
      where: { treeId: 't1' },
      create: { treeId: 't1', content: 'hello world', updatedById: 'user-1' },
      update: { content: 'hello world', updatedById: 'user-1' },
    })
    expect(mockDb.activityLog.create).toHaveBeenCalledOnce()
  })

  it('rejects content over the length cap', async () => {
    const tooLong = 'x'.repeat(MAX_TREE_NOTE_LENGTH + 1)
    const result = await updateTreeNote({ treeId: 't1', content: tooLong })

    expect(result).toEqual({ error: true, message: 'error-note-too-long' })
    expect(mockDb.treeNote.upsert).not.toHaveBeenCalled()
    expect(mockAssertRole).not.toHaveBeenCalled()
  })

  it('accepts content exactly at the length cap', async () => {
    const maxContent = 'x'.repeat(MAX_TREE_NOTE_LENGTH)
    const result = await updateTreeNote({ treeId: 't1', content: maxContent })

    expect(result).toEqual({ error: false })
    expect(mockDb.treeNote.upsert).toHaveBeenCalled()
  })

  it('accepts empty content (clearing the note)', async () => {
    const result = await updateTreeNote({ treeId: 't1', content: '' })

    expect(result).toEqual({ error: false })
    expect(mockDb.treeNote.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ content: '' }),
        update: expect.objectContaining({ content: '' }),
      })
    )
  })

  it('returns error-tree-not-found when tree is missing', async () => {
    mockDb.tree.findUnique.mockResolvedValue(null)
    const result = await updateTreeNote({ treeId: 'missing', content: 'hi' })

    expect(result).toEqual({ error: true, message: 'error-tree-not-found' })
    expect(mockDb.treeNote.upsert).not.toHaveBeenCalled()
  })

  it('propagates error-no-permission from assertRole (VIEWER blocked)', async () => {
    mockAssertRole.mockRejectedValue(new Error('error-no-permission'))
    const result = await updateTreeNote({ treeId: 't1', content: 'hi' })

    expect(result).toEqual({ error: true, message: 'error-no-permission' })
    expect(mockDb.treeNote.upsert).not.toHaveBeenCalled()
  })

  it('skips the activity log when the same user updated within the debounce window', async () => {
    mockDb.activityLog.findFirst.mockResolvedValue({ id: 'recent-log' })

    const result = await updateTreeNote({ treeId: 't1', content: 'another edit' })

    expect(result).toEqual({ error: false })
    expect(mockDb.treeNote.upsert).toHaveBeenCalled()
    expect(mockDb.activityLog.create).not.toHaveBeenCalled()
  })

  it('writes an activity log when no recent log exists', async () => {
    mockDb.activityLog.findFirst.mockResolvedValue(null)

    await updateTreeNote({ treeId: 't1', content: 'first edit' })

    expect(mockDb.activityLog.create).toHaveBeenCalledWith({
      data: {
        treeId: 't1',
        createdBy: 'user-1',
        action: 'NOTE_UPDATED',
        entityId: 't1',
        metadata: { charCount: 'first edit'.length },
      },
    })
  })
})
