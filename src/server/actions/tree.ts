'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { auth } from '@/auth'
import { db } from '@/server/db'
import type { CreateTreeNodeSchema, CreateTreeEdgeSchema } from '@/server/schemas'
import { TreeNode, TreeEdgeType, TreeEdge } from '@/types'

interface TreeNodeResult {
  error: boolean
  message?: string
  node?: TreeNode
  edges?: TreeEdge[]
}

interface TreeEdgeResult {
  error: boolean
  message?: string
  edge?: TreeEdge
}

/**
 * Create new tree node.
 * Auth required.
 * @param values {z.infer<typeof CreateTreeNodeSchema>}
 * @returns Promise<TreeNodeResult>
 */
export const createTreeNode = async (
  values: z.infer<typeof CreateTreeNodeSchema>
): Promise<TreeNodeResult> => {
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

    const createdEdges = edgePromises.length > 0 ? await Promise.all(edgePromises) : []

    revalidatePath('/')
    revalidatePath('/families')
    revalidatePath(`/families/${values.familyId}`)

    return { error: false, node: node || undefined, edges: createdEdges }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-family-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Create new tree edge (relationship).
 * Auth required.
 * @param values {z.infer<typeof CreateTreeEdgeSchema>}
 * @returns Promise<TreeEdgeResult>
 */
export const createTreeEdge = async (
  values: z.infer<typeof CreateTreeEdgeSchema>
): Promise<TreeEdgeResult> => {
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

    const edge = await db.treeEdge.create({
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

    return { error: false, edge: edge || undefined }
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
 * @returns Promise<TreeNodeResult>
 */
export const deleteTreeNode = async (nodeId: string, familyId: string): Promise<TreeNodeResult> => {
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

    return { error: false, node: node as TreeNode, edges: connectedEdges as TreeEdge[] }
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
 * @returns Promise<TreeEdgeResult>
 */
export const deleteTreeEdge = async (edgeId: string, familyId: string): Promise<TreeEdgeResult> => {
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

    return { error: false, edge: edge || undefined }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-edge-not-found' }
    }
    return { error: true, message: 'error' }
  }
}
