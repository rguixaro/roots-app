'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { db } from '@/server/db'
import { assertRole, assertAuthenticated } from '@/server/utils'

import { uploadFileToS3, deleteFileFromS3 } from '@/lib/s3'

import { Picture, PictureTag } from '@/types'

/**
 * Get all pictures for a specific node
 * @param nodeId TreeNode id
 * @returns Promise<Picture[]>
 */
export const getPictures = async (nodeId: string) => {
  try {
    await assertAuthenticated()

    const pictures = await db.pictureTag.findMany({
      where: { nodeId },
      include: {
        picture: {
          include: { tags: { include: { node: { select: { id: true, fullName: true } } } } },
        },
      },
      orderBy: { picture: { createdAt: 'desc' } },
    })
    return pictures.map((tag) => tag.picture)
  } catch (error) {
    return []
  }
}

/**
 * Create a new picture and tag it to a node.
 * Auth required.
 * @param nodeId Node id to tag
 * @param file File to upload
 * @returns Promise<{ error: boolean; picture?: Picture; message?: string }>
 */
export const createPicture = async (
  nodeId: string,
  file: File
): Promise<{ error: boolean; picture?: Picture; message?: string }> => {
  let fileKey: string | null = null

  try {
    const userId = await assertAuthenticated()

    const node = await db.treeNode.findUnique({ where: { id: nodeId } })
    if (!node) return { error: true, message: 'error-node-not-found' }

    await assertRole(node.treeId, userId)

    fileKey = await uploadFileToS3(file, node.treeId)

    const picture = await db.picture.create({
      data: { treeId: node.treeId, fileKey, uploadedBy: userId },
    })

    const newTag = await db.pictureTag.create({
      data: { pictureId: picture.id, nodeId: nodeId, isProfile: false },
    })

    await db.activityLog.create({
      data: {
        treeId: node.treeId,
        createdBy: userId,
        action: 'PICTURE_ADDED',
        entityId: picture.id,
        metadata: { fileKey },
      },
    })

    await db.activityLog.create({
      data: {
        treeId: node.treeId,
        createdBy: userId,
        action: 'PICTURE_TAG_CREATED',
        entityId: newTag.id,
        metadata: { pictureId: picture.id, nodeId: nodeId, nodeName: node.fullName },
      },
    })

    revalidatePath(`/trees/${node.treeId}`)

    return { error: false, picture }
  } catch (e) {
    if (fileKey) {
      try {
        await deleteFileFromS3(fileKey)
      } catch (_) {}
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-not-found' }
    }
    return { error: true, message: 'error-picture-upload' }
  }
}

/**
 * Delete a picture and its tags.
 * Auth required.
 * @param pictureId Picture id to delete
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const deletePicture = async (
  pictureId: string
): Promise<{ error: boolean; message?: string }> => {
  try {
    const userId = await assertAuthenticated()

    const picture = await db.picture.findUnique({
      where: { id: pictureId },
      include: { tags: { include: { node: true } } },
    })
    if (!picture) return { error: true, message: 'error-picture-not-found' }

    await assertRole(picture.treeId, userId)

    try {
      await deleteFileFromS3(picture.fileKey)
    } catch (error) {}

    await db.picture.delete({ where: { id: pictureId } })

    await db.activityLog.create({
      data: {
        treeId: picture.treeId,
        createdBy: userId,
        action: 'PICTURE_DELETED',
        entityId: pictureId,
        metadata: {
          fileKey: picture.fileKey,
          taggedNodeIds: picture.tags.map((tag) => tag.node.id),
          taggedNodeNames: picture.tags.map((tag) => tag.node.fullName),
        },
      },
    })

    revalidatePath(`/trees/${picture.treeId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-not-found' }
    }
    return { error: true, message: 'error-picture-delete' }
  }
}

/**
 * Tag a node in a picture.
 * Auth required.
 * @param pictureId Picture id
 * @param nodeId Node id to tag
 * @returns Promise<{ error: boolean; message?: string, tag?: PictureTag }>
 */
export const createPictureTag = async (
  pictureId: string,
  nodeId: string
): Promise<{ error: boolean; message?: string; tag?: PictureTag }> => {
  try {
    const userId = await assertAuthenticated()

    const picture = await db.picture.findUnique({
      where: { id: pictureId },
      include: { tree: true },
    })
    if (!picture) return { error: true, message: 'error-picture-not-found' }

    await assertRole(picture.treeId, userId)

    const node = await db.treeNode.findUnique({ where: { id: nodeId } })
    if (!node) return { error: true, message: 'error-node-not-found' }

    const existingTag = await db.pictureTag.findUnique({
      where: { pictureId_nodeId: { pictureId, nodeId } },
    })
    if (existingTag) return { error: true, message: 'error-tag-already-exists' }

    const newTag = await db.pictureTag.create({
      data: { pictureId, nodeId, isProfile: false },
      include: { node: { select: { id: true, fullName: true } } },
    })

    await db.activityLog.create({
      data: {
        treeId: picture.treeId,
        createdBy: userId,
        action: 'PICTURE_TAG_CREATED',
        entityId: newTag.id,
        metadata: { pictureId, nodeId, nodeName: node.fullName },
      },
    })

    revalidatePath(`/trees/${picture.treeId}`)

    return { error: false, tag: newTag }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { error: true, message: 'error-tag-already-exists' }
      if (e.code === 'P2025') return { error: true, message: 'error-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Remove a tag from a picture.
 * Auth required.
 * @param pictureId Picture id
 * @param nodeId Node tag to remove
 * @param currentNodeId The node whose gallery we're viewing (optional, for extra validation)
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const deletePictureTag = async (
  pictureId: string,
  nodeId: string,
  currentNodeId?: string
): Promise<{ error: boolean; message?: string }> => {
  try {
    const userId = await assertAuthenticated()

    const picture = await db.picture.findUnique({
      where: { id: pictureId },
      include: { tags: true },
    })
    if (!picture) return { error: true, message: 'error-picture-not-found' }

    await assertRole(picture.treeId, userId)

    if (picture.tags.length <= 1) return { error: true, message: 'error-picture-at-least-one-tag' }

    if (currentNodeId && nodeId === currentNodeId) {
      const otherNodeTags = picture.tags.filter((t) => t.nodeId !== currentNodeId)
      if (otherNodeTags.length === 0)
        return { error: true, message: 'error-picture-at-least-one-tag' }
    }

    const node = await db.treeNode.findUnique({ where: { id: nodeId } })
    if (!node) return { error: true, message: 'error-node-not-found' }

    const tag = await db.pictureTag.findUnique({
      where: { pictureId_nodeId: { pictureId, nodeId } },
    })
    if (!tag) return { error: true, message: 'error-tag-not-found' }

    await db.pictureTag.delete({ where: { id: tag.id } })

    await db.activityLog.create({
      data: {
        treeId: picture.treeId,
        createdBy: userId,
        action: 'PICTURE_TAG_DELETED',
        entityId: pictureId,
        metadata: { pictureId, nodeId, nodeName: node.fullName },
      },
    })

    revalidatePath(`/trees/${picture.treeId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Set a picture as the profile picture for a node.
 * Auth required.
 * @param pictureId Picture id
 * @param nodeId Node id
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const setProfilePictureTag = async (
  pictureId: string,
  nodeId: string
): Promise<{ error: boolean; message?: string }> => {
  try {
    const userId = await assertAuthenticated()

    const picture = await db.picture.findUnique({ where: { id: pictureId } })
    if (!picture) return { error: true, message: 'error-picture-not-found' }

    await assertRole(picture.treeId, userId)

    const node = await db.treeNode.findUnique({ where: { id: nodeId } })
    if (!node) return { error: true, message: 'error-node-not-found' }

    const tag = await db.pictureTag.findUnique({
      where: { pictureId_nodeId: { pictureId, nodeId } },
    })
    if (!tag) return { error: true, message: 'error-tag-not-found' }

    await db.pictureTag.updateMany({
      where: { nodeId: nodeId, isProfile: true, id: { not: tag.id } },
      data: { isProfile: false },
    })

    await db.pictureTag.update({
      where: { id: tag.id },
      data: { isProfile: true },
    })

    revalidatePath(`/trees/${picture.treeId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-not-found' }
    }
    return { error: true, message: 'error' }
  }
}
