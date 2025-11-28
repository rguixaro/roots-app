'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { db } from '@/server/db'
import type { CreatePictureSchema } from '@/server/schemas'
import { assertRole, assertAuthenticated } from '@/server/utils'

import { Picture } from '@/types'

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
      include: { picture: true },
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
 * @param values {z.infer<typeof CreatePictureSchema>}
 * @returns Promise<{ error: boolean; picture?: Picture; message?: string }>
 */
export const createPicture = async (
  values: z.infer<typeof CreatePictureSchema>
): Promise<{ error: boolean; picture?: Picture; message?: string }> => {
  try {
    const userId = await assertAuthenticated()

    const node = await db.treeNode.findUnique({ where: { id: values.nodeId } })
    if (!node) return { error: true, message: 'error-node-not-found' }

    await assertRole(node.treeId, userId)

    const picture = await db.picture.create({
      data: { treeId: node.treeId, fileKey: values.fileKey, uploadedBy: userId },
    })

    const newTag = await db.pictureTag.create({
      data: { pictureId: picture.id, nodeId: values.nodeId, isProfile: false },
    })

    await db.activityLog.create({
      data: {
        treeId: node.treeId,
        createdBy: userId,
        action: 'PICTURE_ADDED',
        entityId: picture.id,
        metadata: { fileKey: values.fileKey },
      },
    })

    await db.activityLog.create({
      data: {
        treeId: node.treeId,
        createdBy: userId,
        action: 'PICTURE_TAG_CREATED',
        entityId: newTag.id,
        metadata: { pictureId: picture.id, nodeId: values.nodeId, nodeName: node.fullName },
      },
    })

    revalidatePath(`/trees/${node.treeId}`)

    return { error: false, picture }
  } catch (e) {
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
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const createPictureTag = async (
  pictureId: string,
  nodeId: string
): Promise<{ error: boolean; message?: string }> => {
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

    const newTag = await db.pictureTag.create({ data: { pictureId, nodeId, isProfile: false } })

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

    return { error: false }
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
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const deletePictureTag = async (
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
export const setProfilePicture = async (
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

/**
 * Remove the profile picture for a node.
 * Auth required.
 * @param nodeId Node id
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const unsetProfilePicture = async (
  nodeId: string
): Promise<{ error: boolean; message?: string }> => {
  try {
    const userId = await assertAuthenticated()

    const node = await db.treeNode.findUnique({ where: { id: nodeId } })
    if (!node) return { error: true, message: 'error-node-not-found' }

    await assertRole(node.treeId, userId)

    const profileTag = await db.pictureTag.findFirst({
      where: { nodeId, isProfile: true },
      include: { picture: true },
    })
    if (!profileTag) return { error: true, message: 'error-tag-not-found' }

    await db.pictureTag.update({
      where: { id: profileTag.id },
      data: { isProfile: false },
    })

    revalidatePath(`/trees/${node.treeId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-not-found' }
    }
    return { error: true, message: 'error' }
  }
}
