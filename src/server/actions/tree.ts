'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { auth } from '@/auth'

import { db } from '@/server/db'
import type {
  CreateTreeNodeSchema,
  CreateTreeEdgeSchema,
  UpdateTreeNodeSchema,
} from '@/server/schemas'

import { TreeEdgeType } from '@/types'

interface TreeResult {
  error: boolean
  message?: string
}

/**
 * Create new tree node.
 * Auth required.
 * @param values {z.infer<typeof CreateTreeNodeSchema>}
 * @returns Promise<TreeResult>
 */
export const createTreeNode = async (
  values: z.infer<typeof CreateTreeNodeSchema>
): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const familyAccess = await db.familyAccess.findFirst({
      where: {
        familyId: values.familyId,
        userId: userId,
        role: { in: ['EDITOR', 'ADMIN'] },
      },
    })

    if (!familyAccess) return { error: true, message: 'error-no-permission' }

    const node = await db.treeNode.create({
      data: {
        familyId: values.familyId,
        fullName: values.fullName,
        birthDate: values.birthDate,
        deathDate: values.deathDate,
        photoUrl: values.photoUrl,
        gender: values.gender,
      },
      include: { edgesFrom: true, edgesTo: true },
    })

    const edgePromises = []

    if (values.motherId) {
      edgePromises.push(
        db.treeEdge.create({
          data: {
            familyId: values.familyId,
            fromNodeId: values.motherId,
            toNodeId: node.id,
            type: 'CHILD' as TreeEdgeType,
          },
        })
      )
    }

    if (values.fatherId) {
      edgePromises.push(
        db.treeEdge.create({
          data: {
            familyId: values.familyId,
            fromNodeId: values.fatherId,
            toNodeId: node.id,
            type: 'CHILD' as TreeEdgeType,
          },
        })
      )
    }

    revalidatePath('/')
    revalidatePath('/families')
    revalidatePath(`/families/${values.familyId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-family-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Update an existing tree node.
 * Auth required.
 * @param values {z.infer<typeof UpdateTreeNodeSchema>}
 * @returns Promise<TreeResult>
 */
export const updateTreeNode = async (
  values: z.infer<typeof UpdateTreeNodeSchema>
): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const familyAccess = await db.familyAccess.findFirst({
      where: {
        familyId: values.familyId,
        userId: userId,
        role: { in: ['EDITOR', 'ADMIN'] },
      },
    })

    if (!familyAccess) return { error: true, message: 'error-no-permission' }

    await db.treeNode.update({
      where: { id: values.id },
      data: {
        fullName: values.fullName,
        birthDate: values.birthDate,
        deathDate: values.deathDate,
        gender: values.gender,
      },
      include: { edgesFrom: true, edgesTo: true },
    })

    revalidatePath('/')
    revalidatePath('/families')
    revalidatePath(`/families/${values.familyId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-node-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Create new tree edge (relationship).
 * Auth required.
 * @param values {z.infer<typeof CreateTreeEdgeSchema>}
 * @returns Promise<TreeResult>
 */
export const createTreeEdge = async (
  values: z.infer<typeof CreateTreeEdgeSchema>
): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const familyAccess = await db.familyAccess.findFirst({
      where: {
        familyId: values.familyId,
        userId: userId,
        role: { in: ['EDITOR', 'ADMIN'] },
      },
    })

    if (!familyAccess) return { error: true, message: 'error-no-permission' }

    const [fromNode, toNode] = await Promise.all([
      db.treeNode.findFirst({ where: { id: values.fromNodeId, familyId: values.familyId } }),
      db.treeNode.findFirst({ where: { id: values.toNodeId, familyId: values.familyId } }),
    ])

    if (!fromNode || !toNode) return { error: true, message: 'error-nodes-not-found' }

    const existingEdge = await db.treeEdge.findFirst({
      where: {
        familyId: values.familyId,
        OR: [
          { fromNodeId: values.fromNodeId, toNodeId: values.toNodeId },
          { fromNodeId: values.toNodeId, toNodeId: values.fromNodeId },
        ],
      },
    })

    if (existingEdge) return { error: true, message: 'error-relationship-already-exists' }

    await db.treeEdge.create({
      data: {
        familyId: values.familyId,
        fromNodeId: values.fromNodeId,
        toNodeId: values.toNodeId,
        type: values.type,
      },
    })

    revalidatePath('/')
    revalidatePath('/families')
    revalidatePath(`/families/${values.familyId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-family-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Delete a tree node and all its associated edges.
 * Auth required.
 * @param nodeId - The id of the node to delete
 * @param familyId - The id of the family the node belongs to
 * @returns Promise<TreeResult>
 */
export const deleteTreeNode = async (nodeId: string, familyId: string): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const familyAccess = await db.familyAccess.findFirst({
      where: { familyId: familyId, userId: userId, role: { in: ['EDITOR', 'ADMIN'] } },
    })

    if (!familyAccess) return { error: true, message: 'error-no-permission' }

    const node = await db.treeNode.findFirst({ where: { id: nodeId, familyId: familyId } })

    if (!node) return { error: true, message: 'error-nodes-not-found' }

    const connectedEdges = await db.treeEdge.findMany({
      where: {
        familyId: familyId,
        OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }],
      },
    })

    if (connectedEdges.length > 0) {
      await db.treeEdge.deleteMany({
        where: { id: { in: connectedEdges.map((edge) => edge.id) } },
      })
    }

    await db.treeNode.delete({ where: { id: nodeId } })

    revalidatePath('/')
    revalidatePath('/families')
    revalidatePath(`/families/${familyId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-nodes-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Delete a tree edge (relationship).
 * Auth required.
 * @param edgeId {string} - The ID of the edge to delete
 * @param familyId {string} - The family ID for permission checking
 * @returns Promise<TreeResult>
 */
export const deleteTreeEdge = async (edgeId: string, familyId: string): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const familyAccess = await db.familyAccess.findFirst({
      where: { familyId: familyId, userId: userId, role: { in: ['EDITOR', 'ADMIN'] } },
    })

    if (!familyAccess) return { error: true, message: 'error-no-permission' }

    const edge = await db.treeEdge.findFirst({ where: { id: edgeId, familyId: familyId } })

    if (!edge) return { error: true, message: 'error-edge-not-found' }

    await db.treeEdge.delete({ where: { id: edgeId } })

    revalidatePath('/')
    revalidatePath('/families')
    revalidatePath(`/families/${familyId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-edge-not-found' }
    }
    return { error: true, message: 'error' }
  }
}
