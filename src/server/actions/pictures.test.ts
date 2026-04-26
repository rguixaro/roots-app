import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/server/db', () => ({
  db: {
    treeNode: { findUnique: vi.fn(), findFirst: vi.fn() },
    treeAccess: { findFirst: vi.fn() },
    picture: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    pictureTag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    activityLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))
vi.mock('@/env.mjs', () => ({
  env: {
    IMAGES_ENABLED: true,
  },
}))
vi.mock('@/lib/s3', () => ({
  uploadFileToS3: vi.fn(),
  deleteFileFromS3: vi.fn(),
}))
vi.mock('@/auth', () => ({ auth: vi.fn(), signOut: vi.fn() }))
vi.mock('@/server/utils', () => ({
  assertAuthenticated: vi.fn(),
  assertRole: vi.fn(),
  assertTreeWritable: vi.fn(),
  slugify: vi.fn(),
  getChanges: vi.fn(),
  checkTreeAccess: vi.fn(),
  getUserById: vi.fn(),
  getAccountByUserId: vi.fn(),
  calculateDaysUntil: vi.fn(),
  isInCurrentWeekOfYear: vi.fn(),
}))

import { db } from '@/server/db'
import { env } from '@/env.mjs'
import { assertAuthenticated, assertRole, assertTreeWritable } from '@/server/utils'
import { uploadFileToS3, deleteFileFromS3 } from '@/lib/s3'
import * as Sentry from '@sentry/nextjs'
import {
  getPictures,
  createPicture,
  deletePicture,
  createPictureTag,
  deletePictureTag,
  setProfilePictureTag,
} from './pictures'

const mockDb = db as any
const mockAssertAuth = assertAuthenticated as ReturnType<typeof vi.fn>
const mockAssertRole = assertRole as ReturnType<typeof vi.fn>
const mockAssertTreeWritable = assertTreeWritable as ReturnType<typeof vi.fn>
const mockUpload = uploadFileToS3 as ReturnType<typeof vi.fn>
const mockDeleteS3 = deleteFileFromS3 as ReturnType<typeof vi.fn>
const mockEnv = env as { IMAGES_ENABLED: boolean }

beforeEach(() => {
  vi.clearAllMocks()
  mockEnv.IMAGES_ENABLED = true
  mockAssertAuth.mockResolvedValue('user-1')
  mockAssertRole.mockResolvedValue(undefined)
  mockAssertTreeWritable.mockResolvedValue(undefined)
  mockDb.$transaction.mockImplementation(async (fn: any) => fn(mockDb))
})

describe('getPictures', () => {
  it('returns empty on auth failure', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await getPictures('n1')
    expect(result).toEqual([])
  })

  it('returns empty when node not found', async () => {
    mockDb.treeNode.findUnique.mockResolvedValue(null)
    const result = await getPictures('n1')
    expect(result).toEqual([])
  })

  it('returns empty when no access', async () => {
    mockDb.treeNode.findUnique.mockResolvedValue({ id: 'n1', treeId: 't1' })
    mockDb.treeAccess.findFirst.mockResolvedValue(null)
    const result = await getPictures('n1')
    expect(result).toEqual([])
  })

  it('returns pictures with metadata for EDITOR', async () => {
    mockDb.treeNode.findUnique.mockResolvedValue({ id: 'n1', treeId: 't1' })
    mockDb.treeAccess.findFirst.mockResolvedValue({ role: 'EDITOR' })
    mockDb.pictureTag.findMany.mockResolvedValue([
      { picture: { id: 'p1', fileKey: 'key1', metadata: { width: 100 }, tags: [] } },
    ])

    const result = await getPictures('n1')
    expect(result).toHaveLength(1)
    expect(result[0].metadata).toEqual({ width: 100 })
  })

  it('returns pictures with null metadata for VIEWER', async () => {
    mockDb.treeNode.findUnique.mockResolvedValue({ id: 'n1', treeId: 't1' })
    mockDb.treeAccess.findFirst.mockResolvedValue({ role: 'VIEWER' })
    mockDb.pictureTag.findMany.mockResolvedValue([
      { picture: { id: 'p1', fileKey: 'key1', metadata: { width: 100 }, tags: [] } },
    ])

    const result = await getPictures('n1')
    expect(result).toHaveLength(1)
    expect(result[0].metadata).toBeNull()
  })
})

describe('createPicture', () => {
  const mockFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })

  it('returns disabled error when images are disabled', async () => {
    mockEnv.IMAGES_ENABLED = false

    const result = await createPicture('n1', mockFile)

    expect(result).toEqual({ error: true, message: 'error-pictures-disabled' })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('rejects non-image file type', async () => {
    const txtFile = new File(['text'], 'doc.txt', { type: 'text/plain' })
    const result = await createPicture('n1', txtFile)
    expect(result).toEqual({ error: true, message: 'error-picture-upload' })
  })

  it('rejects file too large', async () => {
    const bigFile = new File(['x'], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 51 * 1024 * 1024 })
    const result = await createPicture('n1', bigFile)
    expect(result).toEqual({ error: true, message: 'error-picture-too-large' })
  })

  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await createPicture('n1', mockFile)
    expect(result.error).toBe(true)
  })

  it('returns error when node not found', async () => {
    mockDb.treeNode.findUnique.mockResolvedValue(null)
    const result = await createPicture('n1', mockFile)
    expect(result).toEqual({ error: true, message: 'error-node-not-found' })
  })

  it('creates picture successfully', async () => {
    const node = { id: 'n1', treeId: 't1', fullName: 'John', alias: null }
    mockDb.treeNode.findUnique.mockResolvedValue(node)
    mockUpload.mockResolvedValue(['key1', new Date(), { width: 100 }])
    mockDb.picture.create.mockResolvedValue({
      id: 'p1',
      treeId: 't1',
      fileKey: 'key1',
      metadata: { width: 100 },
    })
    mockDb.pictureTag.create.mockResolvedValue({
      id: 'pt1',
      pictureId: 'p1',
      nodeId: 'n1',
      isProfile: false,
      node: { id: 'n1', fullName: 'John', alias: null },
    })
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await createPicture('n1', mockFile)
    expect(result.error).toBe(false)
    expect(result.picture).toBeDefined()
  })

  it('rolls back S3 file on db error', async () => {
    mockDb.treeNode.findUnique.mockResolvedValue({ id: 'n1', treeId: 't1', fullName: 'John' })
    mockUpload.mockResolvedValue(['key1', new Date(), {}])
    mockDb.$transaction.mockRejectedValue(new Error('db error'))

    const result = await createPicture('n1', mockFile)
    expect(result.error).toBe(true)
    expect(mockDeleteS3).toHaveBeenCalledWith('key1')
  })

  it('returns error when user has no permission', async () => {
    mockDb.treeNode.findUnique.mockResolvedValue({ id: 'n1', treeId: 't1', fullName: 'John' })
    mockAssertRole.mockRejectedValue(new Error('error-no-permission'))

    const result = await createPicture('n1', mockFile)
    expect(result).toEqual({ error: true, message: 'error-no-permission' })
  })
})

describe('deletePicture', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await deletePicture('p1')
    expect(result.error).toBe(true)
  })

  it('returns error when picture not found', async () => {
    mockDb.picture.findUnique.mockResolvedValue(null)
    const result = await deletePicture('p1')
    expect(result).toEqual({ error: true, message: 'error-picture-not-found' })
  })

  it('deletes picture and S3 file', async () => {
    mockDb.picture.findUnique.mockResolvedValue({
      id: 'p1',
      treeId: 't1',
      fileKey: 'key1',
      tags: [{ node: { id: 'n1', fullName: 'John' } }],
    })
    mockDeleteS3.mockResolvedValue(undefined)
    mockDb.picture.delete.mockResolvedValue({})
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await deletePicture('p1')
    expect(result.error).toBe(false)
    expect(mockDeleteS3).toHaveBeenCalledWith('key1')
    expect(mockDb.picture.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })

  it('handles S3 cleanup failure gracefully', async () => {
    const s3Error = new Error('S3 delete failed')
    mockDb.picture.findUnique.mockResolvedValue({
      id: 'p1',
      treeId: 't1',
      fileKey: 'key1',
      tags: [{ node: { id: 'n1', fullName: 'John' } }],
    })
    mockDeleteS3.mockRejectedValue(s3Error)
    mockDb.picture.delete.mockResolvedValue({})
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await deletePicture('p1')
    expect(result.error).toBe(false)
    expect(Sentry.captureException).toHaveBeenCalledWith(
      s3Error,
      expect.objectContaining({
        level: 'warning',
        tags: expect.objectContaining({ action: 'deletePicture', step: 's3-cleanup' }),
      })
    )
    expect(mockDb.picture.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })
})

describe('createPictureTag', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await createPictureTag('p1', 'n1')
    expect(result.error).toBe(true)
  })

  it('returns error when picture not found', async () => {
    mockDb.picture.findUnique.mockResolvedValue(null)
    const result = await createPictureTag('p1', 'n1')
    expect(result).toEqual({ error: true, message: 'error-picture-not-found' })
  })

  it('returns error when node not in tree', async () => {
    mockDb.picture.findUnique.mockResolvedValue({ id: 'p1', treeId: 't1', tree: {} })
    mockDb.treeNode.findFirst.mockResolvedValue(null)
    const result = await createPictureTag('p1', 'n1')
    expect(result).toEqual({ error: true, message: 'error-node-not-found' })
  })

  it('returns error when tag already exists', async () => {
    mockDb.picture.findUnique.mockResolvedValue({ id: 'p1', treeId: 't1', tree: {} })
    mockDb.treeNode.findFirst.mockResolvedValue({ id: 'n1', fullName: 'John' })
    mockDb.pictureTag.findUnique.mockResolvedValue({ id: 'existing' })
    const result = await createPictureTag('p1', 'n1')
    expect(result).toEqual({ error: true, message: 'error-tag-already-exists' })
  })

  it('creates tag successfully', async () => {
    mockDb.picture.findUnique.mockResolvedValue({ id: 'p1', treeId: 't1', tree: {} })
    mockDb.treeNode.findFirst.mockResolvedValue({ id: 'n1', fullName: 'John' })
    mockDb.pictureTag.findUnique.mockResolvedValue(null)
    const newTag = {
      id: 'pt1',
      pictureId: 'p1',
      nodeId: 'n1',
      isProfile: false,
      node: { id: 'n1', fullName: 'John', alias: null },
    }
    mockDb.pictureTag.create.mockResolvedValue(newTag)
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await createPictureTag('p1', 'n1')
    expect(result.error).toBe(false)
    expect(result.tag).toEqual(newTag)
  })
})

describe('deletePictureTag', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await deletePictureTag('p1', 'n1')
    expect(result.error).toBe(true)
  })

  it('returns error when picture not found', async () => {
    mockDb.picture.findUnique.mockResolvedValue(null)
    const result = await deletePictureTag('p1', 'n1')
    expect(result).toEqual({ error: true, message: 'error-picture-not-found' })
  })

  it('rejects when last tag', async () => {
    mockDb.picture.findUnique.mockResolvedValue({
      id: 'p1',
      treeId: 't1',
      tags: [{ nodeId: 'n1' }],
    })
    const result = await deletePictureTag('p1', 'n1')
    expect(result).toEqual({ error: true, message: 'error-picture-at-least-one-tag' })
  })

  it('deletes tag successfully', async () => {
    mockDb.picture.findUnique.mockResolvedValue({
      id: 'p1',
      treeId: 't1',
      tags: [{ nodeId: 'n1' }, { nodeId: 'n2' }],
    })
    mockDb.treeNode.findUnique.mockResolvedValue({ id: 'n1', fullName: 'John' })
    mockDb.pictureTag.findUnique.mockResolvedValue({ id: 'pt1' })
    mockDb.pictureTag.delete.mockResolvedValue({})
    mockDb.activityLog.create.mockResolvedValue({})

    const result = await deletePictureTag('p1', 'n1')
    expect(result.error).toBe(false)
  })
})

describe('setProfilePictureTag', () => {
  it('returns error when not authenticated', async () => {
    mockAssertAuth.mockRejectedValue(new Error('unauthenticated'))
    const result = await setProfilePictureTag('p1', 'n1')
    expect(result.error).toBe(true)
  })

  it('returns error when picture not found', async () => {
    mockDb.picture.findUnique.mockResolvedValue(null)
    const result = await setProfilePictureTag('p1', 'n1')
    expect(result).toEqual({ error: true, message: 'error-picture-not-found' })
  })

  it('returns error when tag not found', async () => {
    mockDb.picture.findUnique.mockResolvedValue({ id: 'p1', treeId: 't1' })
    mockDb.treeNode.findFirst.mockResolvedValue({ id: 'n1' })
    mockDb.pictureTag.findUnique.mockResolvedValue(null)
    const result = await setProfilePictureTag('p1', 'n1')
    expect(result).toEqual({ error: true, message: 'error-tag-not-found' })
  })

  it('sets profile picture via transaction', async () => {
    mockDb.picture.findUnique.mockResolvedValue({ id: 'p1', treeId: 't1' })
    mockDb.treeNode.findFirst.mockResolvedValue({ id: 'n1' })
    mockDb.pictureTag.findUnique.mockResolvedValue({ id: 'pt1' })
    mockDb.pictureTag.updateMany.mockResolvedValue({})
    mockDb.pictureTag.update.mockResolvedValue({})

    const result = await setProfilePictureTag('p1', 'n1')
    expect(result.error).toBe(false)
    expect(mockDb.pictureTag.updateMany).toHaveBeenCalledWith({
      where: { nodeId: 'n1', isProfile: true, id: { not: 'pt1' } },
      data: { isProfile: false },
    })
    expect(mockDb.pictureTag.update).toHaveBeenCalledWith({
      where: { id: 'pt1' },
      data: { isProfile: true },
    })
  })
})
