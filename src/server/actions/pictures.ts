'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { auth } from '@/auth'

import { db } from '@/server/db'
import type { CreatePictureSchema } from '@/server/schemas'

import { Picture } from '@/types'

/**
 * Get all pictures for a specific node
 * @param nodeId TreeNode id
 * @returns Promise<Picture[]>
 */
export const getPictures = async (nodeId: string) => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  /** Not authenticated */
  if (!userId) return []

  try {
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
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true, message: 'error-not-authenticated' }

  try {
    const node = await db.treeNode.findUnique({ where: { id: values.nodeId } })

    if (!node) return { error: true, message: 'error-node-not-found' }

    const treeAccess = await db.treeAccess.findFirst({
      where: {
        treeId: node.treeId,
        userId: userId,
        role: { in: ['EDITOR', 'ADMIN'] },
      },
    })

    if (!treeAccess) return { error: true, message: 'error-no-permission' }

    const picture = await db.picture.create({
      data: { treeId: node.treeId, fileKey: values.fileKey, uploadedBy: userId },
    })

    await db.pictureTag.create({
      data: { pictureId: picture.id, nodeId: values.nodeId, isProfile: false },
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
