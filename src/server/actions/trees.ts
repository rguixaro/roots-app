'use server'

import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'
import type { z } from 'zod'

import { db } from '@/server/db'
import { deleteFileFromS3 } from '@/lib/s3'
import {
  CreateTreeSchema,
  CreateTreeNodeSchema,
  CreateTreeEdgeSchema,
  UpdateTreeNodeSchema,
} from '@/server/schemas'
import type { TreeAccessRole } from '@/server/schemas'
import { slugify, assertRole, assertAuthenticated, getChanges } from '@/server/utils'

import { sendTreeInvitationEmail } from '@/lib/email'

import { languageToLocale } from '@/utils/language'

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
    CreateTreeSchema.parse(values)
    const userId = await assertAuthenticated()

    const tree = await db.tree.create({
      data: {
        slug: slugify(values.name),
        name: values.name,
        type: values.type,
        newsletter: values.newsletter,
        accesses: { create: { userId, role: 'ADMIN' } },
      },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree || undefined }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { error: true, message: 'error-tree-exists' }
    }
    Sentry.captureException(e, { tags: { action: 'createTree' } })
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
    CreateTreeSchema.parse(values)
    const userId = await assertAuthenticated()
    await assertRole(id, userId)

    const prevTree = await db.tree.findUnique({ where: { id } })
    if (!prevTree) return { error: true, message: 'error-tree-not-found' }

    const updatedTree = await db.tree.update({
      where: { id },
      data: {
        name: values.name,
        type: values.type,
        newsletter: values.newsletter,
        slug: slugify(values.name),
      },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })

    const changes = getChanges(prevTree, values, ['name', 'type', 'newsletter'])

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
    Sentry.captureException(e, { tags: { action: 'updateTree' } })
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
    await assertRole(treeId, inviterId)

    if (role === 'ADMIN') {
      const inviterAccess = await db.treeAccess.findFirst({ where: { treeId, userId: inviterId } })
      if (inviterAccess?.role !== 'ADMIN') return { error: true, message: 'error-no-permission' }
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return { error: true, message: 'error-user-not-found' }

    const existing = await db.treeAccess.findFirst({ where: { treeId, userId: user.id } })
    if (existing) return { error: true, message: 'error-user-already-in-tree' }

    await db.treeAccess.create({ data: { treeId, userId: user.id, role } })

    const tree = await db.tree.findUnique({
      where: { id: treeId },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })

    const inviter = await db.user.findUnique({ where: { id: inviterId } })
    if (tree && inviter) {
      await sendTreeInvitationEmail({
        recipientEmail: user.email!,
        recipientName: user.name || user.email!,
        inviterName: inviter.name || inviter.email!,
        treeName: tree.name,
        treeSlug: tree.slug,
        role,
        locale: user.language ? languageToLocale(user.language) : 'en',
      }).catch((err) =>
        Sentry.captureException(err, {
          level: 'warning',
          tags: { action: 'inviteMember', step: 'send-email' },
        })
      )
    }

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree || undefined }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    Sentry.captureException(e, { tags: { action: 'inviteMember' } })
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
    const userId = await assertAuthenticated()
    await assertRole(treeId, userId, ['ADMIN'])

    if (role !== 'ADMIN') {
      const remainingAdmins = await db.treeAccess.count({
        where: { treeId, role: 'ADMIN', userId: { not: memberId } },
      })
      if (remainingAdmins === 0) return { error: true, message: 'error-tree-admin-required' }
    }

    await db.treeAccess.update({
      where: { treeId_userId: { treeId, userId: memberId } },
      data: { role },
    })

    const tree = await db.tree.findUnique({
      where: { id: treeId },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree ?? undefined }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    Sentry.captureException(e, { tags: { action: 'updateMember' } })
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
    const userId = await assertAuthenticated()
    await assertRole(treeId, userId, ['ADMIN'])

    const target = await db.treeAccess.findUnique({
      where: { treeId_userId: { treeId, userId: memberId } },
      select: { role: true },
    })
    if (target?.role === 'ADMIN') {
      const remainingAdmins = await db.treeAccess.count({
        where: { treeId, role: 'ADMIN', userId: { not: memberId } },
      })
      if (remainingAdmins === 0) return { error: true, message: 'error-tree-admin-required' }
    }

    await db.treeAccess.delete({ where: { treeId_userId: { treeId, userId: memberId } } })

    const tree = await db.tree.findUnique({
      where: { id: treeId },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, tree: tree ?? undefined }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    Sentry.captureException(e, { tags: { action: 'removeMember' } })
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
    CreateTreeNodeSchema.parse(values)
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
    Sentry.captureException(e, { tags: { action: 'createTreeNode' } })
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
    UpdateTreeNodeSchema.parse(values)
    const userId = await assertAuthenticated()
    await assertRole(values.treeId, userId)

    const prevNode = await db.treeNode.findFirst({
      where: { id: values.id, treeId: values.treeId },
    })
    if (!prevNode) return { error: true, message: 'error-node-not-found' }

    await db.treeNode.update({
      where: { id: prevNode.id },
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
    Sentry.captureException(e, { tags: { action: 'updateTreeNode' } })
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
    CreateTreeEdgeSchema.parse(values)
    const userId = await assertAuthenticated()
    await assertRole(values.treeId, userId)

    if (values.fromNodeId === values.toNodeId)
      return { error: true, message: 'error-cannot-connect-to-self' }

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
    Sentry.captureException(e, { tags: { action: 'createTreeEdge' } })
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

    await db.$transaction(async (tx) => {
      if (connectedEdges.length > 0)
        await tx.treeEdge.deleteMany({
          where: { id: { in: connectedEdges.map((edge) => edge.id) } },
        })

      // Delete pictures where this node is the only tagged member
      const orphanedPictures = await tx.picture.findMany({
        where: {
          treeId,
          tags: { every: { nodeId }, some: {} },
        },
      })
      if (orphanedPictures.length > 0) {
        await tx.pictureTag.deleteMany({
          where: { pictureId: { in: orphanedPictures.map((p) => p.id) } },
        })
        await tx.picture.deleteMany({
          where: { id: { in: orphanedPictures.map((p) => p.id) } },
        })

        // Clean up S3 files (best-effort, outside transaction)
        for (const pic of orphanedPictures) {
          await deleteFileFromS3(pic.fileKey).catch((err) =>
            Sentry.captureException(err, {
              level: 'warning',
              tags: { action: 'deleteTreeNode', step: 's3-cleanup' },
            })
          )
        }
      }

      await tx.treeNode.delete({ where: { id: nodeId } })

      await tx.activityLog.create({
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
    Sentry.captureException(e, { tags: { action: 'deleteTreeNode' } })
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

    await db.$transaction(async (tx) => {
      await tx.treeEdge.delete({ where: { id: edgeId } })

      await tx.activityLog.create({
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
    })

    revalidatePath('/')
    revalidatePath('/trees')
    revalidatePath(`/trees/${treeId}`)

    return { error: false }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-edge-not-found' }
    }
    Sentry.captureException(e, { tags: { action: 'deleteTreeEdge' } })
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
    const userId = await assertAuthenticated()

    const hasAccess = await db.treeAccess.findFirst({ where: { treeId, userId } })
    if (!hasAccess) return []

    return await db.treeNode.findMany({ where: { treeId } })
  } catch (error) {
    Sentry.captureException(error, { tags: { action: 'getTreeNodes' } })
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
    const userId = await assertAuthenticated()

    const tree = await db.tree.findFirst({
      where: { slug, accesses: { some: { userId } } },
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
    Sentry.captureException(error, { tags: { action: 'getTimelineEvents' } })
    return []
  }
}

export type ShareTokenTtlDays = 1 | 7 | 30

interface ShareTokenResult {
  error: boolean
  message?: string
  token?: string
  expiresAt?: Date
}

interface JoinResult {
  error: boolean
  message?: string
  slug?: string
  alreadyMember?: boolean
}

interface ShareLink {
  token: string
  expiresAt: Date
}

/**
 * Generate (or rotate) a share token for a tree.
 * Auth required. ADMIN or EDITOR only.
 * Overwriting the token implicitly invalidates the previous one.
 */
export const generateShareToken = async (
  treeId: string,
  ttlDays: ShareTokenTtlDays
): Promise<ShareTokenResult> => {
  try {
    if (ttlDays !== 1 && ttlDays !== 7 && ttlDays !== 30)
      return { error: true, message: 'error-invalid-ttl' }

    const userId = await assertAuthenticated()
    await assertRole(treeId, userId)

    const token = crypto.randomBytes(24).toString('base64url')
    const expiresAt = new Date(Date.now() + ttlDays * 86_400_000)

    const tree = await db.tree.update({
      where: { id: treeId },
      data: { shareToken: token, shareTokenExpiresAt: expiresAt },
    })

    await db.activityLog.create({
      data: {
        treeId,
        createdBy: userId,
        action: 'SHARE_TOKEN_GENERATED',
        entityId: treeId,
        metadata: { ttlDays, expiresAt: expiresAt.toISOString() },
      },
    })

    revalidatePath('/trees')
    revalidatePath(`/trees/${tree.slug}`)

    return { error: false, token, expiresAt }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    if (e?.message === 'unauthenticated') return { error: true, message: 'unauthenticated' }
    Sentry.captureException(e, { tags: { action: 'generateShareToken' } })
    return { error: true, message: 'error' }
  }
}

/**
 * Return the current active (unexpired) share link for a tree.
 * Auth required. ADMIN or EDITOR only — re-checked server-side.
 */
export const getShareLink = async (treeId: string): Promise<ShareLink | null> => {
  try {
    const userId = await assertAuthenticated()
    await assertRole(treeId, userId)

    const tree = await db.tree.findUnique({
      where: { id: treeId },
      select: { shareToken: true, shareTokenExpiresAt: true },
    })

    if (!tree?.shareToken || !tree.shareTokenExpiresAt) return null
    if (tree.shareTokenExpiresAt.getTime() < Date.now()) return null

    return { token: tree.shareToken, expiresAt: tree.shareTokenExpiresAt }
  } catch (e) {
    Sentry.captureException(e, { tags: { action: 'getShareLink' } })
    return null
  }
}

/**
 * Join a tree via share token. Auth required.
 * Creates TreeAccess with VIEWER role if one doesn't already exist.
 * Never demotes an existing member. Idempotent under race via P2002 catch.
 */
export const joinTreeViaShareToken = async (token: string): Promise<JoinResult> => {
  try {
    const userId = await assertAuthenticated()

    const tree = await db.tree.findFirst({
      where: { shareToken: token },
      select: { id: true, slug: true, shareTokenExpiresAt: true },
    })
    if (!tree) return { error: true, message: 'error-share-token-invalid' }

    if (!tree.shareTokenExpiresAt || tree.shareTokenExpiresAt.getTime() < Date.now())
      return { error: true, message: 'error-share-token-expired' }

    let alreadyMember = false
    try {
      await db.treeAccess.create({ data: { treeId: tree.id, userId, role: 'VIEWER' } })

      const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } })
      await db.activityLog.create({
        data: {
          treeId: tree.id,
          createdBy: userId,
          action: 'MEMBER_JOINED_VIA_SHARE',
          entityId: userId,
          metadata: { joinedName: user?.name ?? null },
        },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        alreadyMember = true
      } else throw e
    }

    revalidatePath('/')
    revalidatePath('/trees')

    return { error: false, slug: tree.slug, alreadyMember }
  } catch (e: any) {
    if (e?.message === 'unauthenticated') return { error: true, message: 'unauthenticated' }
    Sentry.captureException(e, { tags: { action: 'joinTreeViaShareToken' } })
    return { error: true, message: 'error' }
  }
}
