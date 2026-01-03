'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { db } from '@/server/db'
import type {
  CreateTreeSchema,
  CreateTreeNodeSchema,
  CreateTreeEdgeSchema,
  UpdateTreeNodeSchema,
  TreeAccessRole,
} from '@/server/schemas'
import { slugify, assertRole, assertAuthenticated, getChanges } from '@/server/utils'

import { Tree, TreeNode, TimelineEvent } from '@/types'

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
  try {
    const userId = await assertAuthenticated()

    const tree = await db.tree.create({
      data: {
        slug: slugify(values.name),
        name: values.name,
        type: values.type,
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
  values: z.infer<typeof CreateTreeSchema>
): Promise<TreeResult> => {
  try {
    const userId = await assertAuthenticated()
    await assertRole(id, userId)

    const prevTree = await db.tree.findUnique({ where: { id } })
    if (!prevTree) return { error: true, message: 'error-tree-not-found' }

    const updatedTree = await db.tree.update({
      where: { id },
      data: {
        name: values.name,
        type: values.type,
        slug: slugify(values.name),
      },
      include: { accesses: { include: { user: true } } },
    })

    const changes = getChanges(prevTree, values, ['name', 'type'])

    if (changes) {
      await db.activityLog.create({
        data: {
          treeId: id,
          createdBy: userId,
          action: 'TREE_UPDATED',
          entityId: id,
          metadata: { treeName: values.name, changes },
        },
      })
    }

    return { error: false, tree: updatedTree || undefined }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
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
 * @param treeId {string} Tree id
 * @param email {string} User email
 * @param role {TreeAccessRole} Tree access role
 * @returns Promise<TreeResult>
 */
export const inviteMember = async (
  treeId: string,
  email: string,
  role: TreeAccessRole
): Promise<TreeResult> => {
  try {
    const inviterId = await assertAuthenticated()

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
 * @param treeId {string} Tree id
 * @param memberId {string} User id of the member
 * @param role {TreeAccessRole} New role
 * @returns Promise<TreeResult>
 */
export const updateMember = async (
  treeId: string,
  memberId: string,
  role: TreeAccessRole
): Promise<TreeResult> => {
  try {
    await assertAuthenticated()

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
 * @param treeId {string} Tree id
 * @param memberId {string} User id to remove
 * @returns Promise<TreeResult>
 */
export const removeMember = async (treeId: string, memberId: string): Promise<TreeResult> => {
  try {
    await assertAuthenticated()

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
  try {
    const userId = await assertAuthenticated()
    await assertRole(values.treeId, userId)

    const node = await db.treeNode.create({
      data: {
        treeId: values.treeId,
        fullName: values.fullName,
        alias: values.alias,
        birthPlace: values.birthPlace,
        birthDate: values.birthDate,
        deathPlace: values.deathPlace,
        deathDate: values.deathDate,
        gender: values.gender,
      },
      include: { edgesFrom: true, edgesTo: true },
    })

    await db.activityLog.create({
      data: {
        treeId: values.treeId,
        createdBy: userId,
        action: 'NODE_CREATED',
        entityId: node.id,
        metadata: { nodeName: values.fullName },
      },
    })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${values.treeId}`)

    return { error: false }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
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
  try {
    const userId = await assertAuthenticated()
    await assertRole(values.treeId, userId)

    const prevNode = await db.treeNode.findUnique({ where: { id: values.id } })
    if (!prevNode) return { error: true, message: 'error-node-not-found' }

    await db.treeNode.update({
      where: { id: values.id },
      data: {
        fullName: values.fullName,
        alias: values.alias,
        birthPlace: values.birthPlace,
        birthDate: values.birthDate,
        deathPlace: values.deathPlace,
        deathDate: values.deathDate,
        gender: values.gender,
        biography: values.biography,
      },
      include: { edgesFrom: true, edgesTo: true },
    })

    const changes = getChanges(prevNode, values, ['fullName', 'birthDate', 'deathDate', 'gender'])

    if (changes)
      await db.activityLog.create({
        data: {
          treeId: values.treeId,
          createdBy: userId,
          action: 'NODE_UPDATED',
          entityId: values.id,
          metadata: { nodeName: values.fullName, changes },
        },
      })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${values.treeId}`)

    return { error: false }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
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
  try {
    const userId = await assertAuthenticated()
    await assertRole(values.treeId, userId)

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

    const newEdge = await db.treeEdge.create({
      data: {
        treeId: values.treeId,
        fromNodeId: values.fromNodeId,
        toNodeId: values.toNodeId,
        type: values.type,
      },
    })

    await db.activityLog.create({
      data: {
        treeId: values.treeId,
        createdBy: userId,
        action: 'EDGE_CREATED',
        entityId: newEdge.id,
        metadata: {
          fromNodeId: values.fromNodeId,
          fromNodeName: fromNode.fullName,
          toNodeId: values.toNodeId,
          toNodeName: toNode.fullName,
          type: values.type,
        },
      },
    })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${values.treeId}`)

    return { error: false }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
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
  try {
    const userId = await assertAuthenticated()
    await assertRole(treeId, userId)

    const nodeToDelete = await db.treeNode.findFirst({ where: { id: nodeId, treeId: treeId } })
    if (!nodeToDelete) return { error: true, message: 'error-nodes-not-found' }

    const connectedEdges = await db.treeEdge.findMany({
      where: { treeId: treeId, OR: [{ fromNodeId: nodeId }, { toNodeId: nodeId }] },
    })

    if (connectedEdges.length > 0)
      await db.treeEdge.deleteMany({ where: { id: { in: connectedEdges.map((edge) => edge.id) } } })

    await db.treeNode.delete({ where: { id: nodeId } })

    await db.activityLog.create({
      data: {
        treeId: treeId,
        createdBy: userId,
        action: 'NODE_DELETED',
        entityId: nodeId,
        metadata: {
          nodeName: nodeToDelete.fullName,
          edgeIds: connectedEdges.map((edge) => edge.id),
        },
      },
    })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${treeId}`)

    return { error: false }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-nodes-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Delete a tree edge (relationship).
 * Auth required.
 * @param edgeId {string} - The id of the edge to delete
 * @param treeId {string} - The tree id for permission checking
 * @returns Promise<TreeResult>
 */
export const deleteTreeEdge = async (edgeId: string, treeId: string): Promise<TreeResult> => {
  try {
    const userId = await assertAuthenticated()
    await assertRole(treeId, userId)

    const edgeToDelete = await db.treeEdge.findFirst({ where: { id: edgeId, treeId: treeId } })
    if (!edgeToDelete) return { error: true, message: 'error-edge-not-found' }

    const [fromNode, toNode] = await Promise.all([
      db.treeNode.findFirst({ where: { id: edgeToDelete.fromNodeId, treeId: treeId } }),
      db.treeNode.findFirst({ where: { id: edgeToDelete.toNodeId, treeId: treeId } }),
    ])
    if (!fromNode || !toNode) return { error: true, message: 'error-nodes-not-found' }

    await db.treeEdge.delete({ where: { id: edgeId } })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${treeId}`)

    await db.activityLog.create({
      data: {
        treeId: treeId,
        createdBy: userId,
        action: 'EDGE_DELETED',
        entityId: edgeId,
        metadata: {
          fromNodeId: fromNode.id,
          fromNodeName: fromNode.fullName,
          toNodeId: toNode.id,
          toNodeName: toNode.fullName,
          type: edgeToDelete.type,
        },
      },
    })

    return { error: false }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-edge-not-found' }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Get all tree nodes for a specific tree
 * @param treeId Tree id
 * @returns Promise<TreeNode[]>
 */
export const getTreeNodes = async (treeId: string): Promise<TreeNode[]> => {
  try {
    await assertAuthenticated()

    return await db.treeNode.findMany({ where: { treeId } })
  } catch (error) {
    return []
  }
}

/**
 * Get all major events (births and deaths) for a specific tree by slug
 * @param slug Tree slug
 * @returns Promise<TimelineEvent[]>
 */
export const getTimelineEvents = async (slug: string): Promise<TimelineEvent[]> => {
  try {
    await assertAuthenticated()

    const tree = await db.tree.findUnique({
      where: { slug },
      include: {
        nodes: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            deathDate: true,
            birthPlace: true,
            deathPlace: true,
            taggedIn: {
              select: {
                isProfile: true,
                picture: { select: { fileKey: true, date: true, tags: true } },
              },
            },
          },
        },
      },
    })

    if (!tree) return []

    const events: TimelineEvent[] = []

    tree.nodes.forEach((node) => {
      if (node.birthDate) {
        events.push({
          type: 'birth',
          date: node.birthDate,
          name: node.fullName,
          place: node.birthPlace ?? undefined,
          picture: node.taggedIn.find((tag) => tag.isProfile)?.picture.fileKey,
        })
      }

      if (node.deathDate) {
        events.push({
          type: 'death',
          date: node.deathDate,
          name: node.fullName,
          place: node.deathPlace ?? undefined,
          picture: node.taggedIn.find((tag) => tag.isProfile)?.picture.fileKey,
        })
      }
    })

    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
  } catch (error) {
    return []
  }
}
