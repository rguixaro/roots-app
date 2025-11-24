'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { auth } from '@/auth'

import { db } from '@/server/db'
import type {
  CreateTreeSchema,
  CreateTreeNodeSchema,
  CreateTreeEdgeSchema,
  UpdateTreeNodeSchema,
  TreeAccessRole,
} from '@/server/schemas'
import { slugify } from '@/server/utils'

import { Tree, TreeEdgeType } from '@/types'

interface TreeResult {
  error: boolean
  message?: string
  tree?: Tree
}

/**
 * Create new tree.
 * Auth required.
 * @param values {z.infer<typeof CreateTreeSchema>}
 * @returns Promise<TreeResult>
 */
export const createTree = async (values: z.infer<typeof CreateTreeSchema>): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const tree = await db.tree.create({
      data: {
        slug: slugify(values.name),
        name: values.name,
        type: values.type,
        nodeImage: values.nodeImage ?? false,
        nodeGallery: values.nodeGallery ?? false,
        accesses: { create: { userId, role: 'ADMIN' } },
      },
      include: { accesses: { include: { user: true } } },
    })

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree || undefined }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { error: true, message: 'error-tree-exists' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Update an existing tree.
 * Auth required.
 * Only users with ADMIN or EDITOR role can update.
 * @param values {z.infer<typeof CreateTreeSchema>}
 * @returns Promise<TreeResult>
 */
export const updateTree = async (
  id: string,
  userId: string,
  values: z.infer<typeof CreateTreeSchema>
): Promise<TreeResult> => {
  const currentUser = await auth()

  // Not authenticated
  if (!currentUser) return { error: true }

  try {
    const access = await db.treeAccess.findFirst({
      where: { treeId: id, userId, role: { in: ['ADMIN', 'EDITOR'] } },
    })

    if (!access) return { error: true }

    const tree = await db.tree.update({
      where: { id },
      data: {
        name: values.name,
        type: values.type,
        nodeImage: values.nodeImage,
        nodeGallery: values.nodeGallery,
        slug: slugify(values.name),
      },
      include: { accesses: { include: { user: true } } },
    })

    return { error: false, tree: tree || undefined }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { error: true, message: 'error-tree-exists' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Invite a user to a tree.
 * Auth required.
 * Only users with ADMIN or EDITOR role can invite.
 * @param treeId {string} Tree ID
 * @param email {string} User email
 * @param role {TreeAccessRole} Tree access role
 * @returns Promise<TreeResult>
 */
export const inviteMember = async (
  treeId: string,
  email: string,
  role: TreeAccessRole
): Promise<TreeResult> => {
  const currentUser = await auth()

  // Not authenticated
  if (!currentUser) return { error: true }

  try {
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return { error: true, message: 'error-user-not-found' }

    const existing = await db.treeAccess.findFirst({ where: { treeId, userId: user.id } })

    if (existing) return { error: true, message: 'error-user-already-in-tree' }

    await db.treeAccess.create({ data: { treeId, userId: user.id, role } })

    const tree = await db.tree.findUnique({
      where: { id: treeId },
      include: { accesses: { include: { user: true } } },
    })

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree || undefined }
  } catch (e) {
    return { error: true, message: 'error' }
  }
}

/**
 * Update a tree member's role.
 * @param treeId {string} Tree ID
 * @param memberId {string} User ID of the member
 * @param role {TreeAccessRole} New role
 * @returns Promise<TreeResult>
 */
export const updateMember = async (
  treeId: string,
  memberId: string,
  role: TreeAccessRole
): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    await db.treeAccess.update({
      where: { treeId_userId: { treeId, userId: memberId } },
      data: { role },
    })

    const tree = await db.tree.findUnique({
      where: { id: treeId },
      include: { accesses: { include: { user: true } } },
    })

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree ?? undefined }
  } catch (e) {
    return { error: true, message: 'error' }
  }
}

/**
 * Remove a user from a tree.
 * Auth required.
 * Only users with ADMIN or EDITOR role can remove members.
 * @param treeId {string} Tree ID
 * @param memberId {string} User ID to remove
 * @returns Promise<TreeResult>
 */
export const removeMember = async (treeId: string, memberId: string): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    await db.treeAccess.delete({ where: { treeId_userId: { treeId, userId: memberId } } })

    const tree = await db.tree.findUnique({
      where: { id: treeId },
      include: { accesses: { include: { user: true } } },
    })

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree ?? undefined }
  } catch (e) {
    return { error: true, message: 'error' }
  }
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
    const treeAccess = await db.treeAccess.findFirst({
      where: {
        treeId: values.treeId,
        userId: userId,
        role: { in: ['EDITOR', 'ADMIN'] },
      },
    })

    if (!treeAccess) return { error: true, message: 'error-no-permission' }

    const node = await db.treeNode.create({
      data: {
        treeId: values.treeId,
        fullName: values.fullName,
        birthDate: values.birthDate,
        deathDate: values.deathDate,
        gender: values.gender,
      },
      include: { edgesFrom: true, edgesTo: true },
    })

    const edgePromises = []

    if (values.motherId) {
      edgePromises.push(
        db.treeEdge.create({
          data: {
            treeId: values.treeId,
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
            treeId: values.treeId,
            fromNodeId: values.fatherId,
            toNodeId: node.id,
            type: 'CHILD' as TreeEdgeType,
          },
        })
      )
    }

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${values.treeId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-tree-not-found' }
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
    const treeAccess = await db.treeAccess.findFirst({
      where: {
        treeId: values.treeId,
        userId: userId,
        role: { in: ['EDITOR', 'ADMIN'] },
      },
    })

    if (!treeAccess) return { error: true, message: 'error-no-permission' }

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
    revalidatePath('/trees')
    revalidatePath(`/trees/${values.treeId}`)

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
    const treeAccess = await db.treeAccess.findFirst({
      where: {
        treeId: values.treeId,
        userId: userId,
        role: { in: ['EDITOR', 'ADMIN'] },
      },
    })

    if (!treeAccess) return { error: true, message: 'error-no-permission' }

    const [fromNode, toNode] = await Promise.all([
      db.treeNode.findFirst({ where: { id: values.fromNodeId, treeId: values.treeId } }),
      db.treeNode.findFirst({ where: { id: values.toNodeId, treeId: values.treeId } }),
    ])

    if (!fromNode || !toNode) return { error: true, message: 'error-nodes-not-found' }

    const existingEdge = await db.treeEdge.findFirst({
      where: {
        treeId: values.treeId,
        OR: [
          { fromNodeId: values.fromNodeId, toNodeId: values.toNodeId },
          { fromNodeId: values.toNodeId, toNodeId: values.fromNodeId },
        ],
      },
    })

    if (existingEdge) return { error: true, message: 'error-relationship-already-exists' }

    await db.treeEdge.create({
      data: {
        treeId: values.treeId,
        fromNodeId: values.fromNodeId,
        toNodeId: values.toNodeId,
        type: values.type,
      },
    })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${values.treeId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-tree-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Delete a tree node and all its associated edges.
 * Auth required.
 * @param nodeId - The id of the node to delete
 * @param treeId - The id of the tree the node belongs to
 * @returns Promise<TreeResult>
 */
export const deleteTreeNode = async (nodeId: string, treeId: string): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const treeAccess = await db.treeAccess.findFirst({
      where: { treeId: treeId, userId: userId, role: { in: ['EDITOR', 'ADMIN'] } },
    })

    if (!treeAccess) return { error: true, message: 'error-no-permission' }

    const node = await db.treeNode.findFirst({ where: { id: nodeId, treeId: treeId } })

    if (!node) return { error: true, message: 'error-nodes-not-found' }

    const connectedEdges = await db.treeEdge.findMany({
      where: { treeId: treeId, OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }] },
    })

    if (connectedEdges.length > 0) {
      await db.treeEdge.deleteMany({
        where: { id: { in: connectedEdges.map((edge) => edge.id) } },
      })
    }

    await db.treeNode.delete({ where: { id: nodeId } })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${treeId}`)

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
 * @param treeId {string} - The tree ID for permission checking
 * @returns Promise<TreeResult>
 */
export const deleteTreeEdge = async (edgeId: string, treeId: string): Promise<TreeResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    const treeAccess = await db.treeAccess.findFirst({
      where: { treeId: treeId, userId: userId, role: { in: ['EDITOR', 'ADMIN'] } },
    })

    if (!treeAccess) return { error: true, message: 'error-no-permission' }

    const edge = await db.treeEdge.findFirst({ where: { id: edgeId, treeId: treeId } })

    if (!edge) return { error: true, message: 'error-edge-not-found' }

    await db.treeEdge.delete({ where: { id: edgeId } })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${treeId}`)

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-edge-not-found' }
    }
    return { error: true, message: 'error' }
  }
}
