import { cache } from 'react'

import { db } from '@/server/db'
import { assertAuthenticated } from '@/server/utils/auth'

import { PictureMetadata } from '@/types'

/**
 * Get trees that a user has access to.
 * Auth required.
 * @param userId optional, if not provided uses current user
 * @returns Promise<{ trees: Tree[] } | null>
 */
export const getTrees = cache(async () => {
  try {
    const userId = await assertAuthenticated()

    const trees = await db.tree.findMany({
      where: { accesses: { some: { userId: userId } } },
      include: {
        accesses: true,
        _count: { select: { nodes: true } },
      },
    })
    return { trees: trees }
  } catch (error) {
    throw error
  }
})

/**
 * Get the tree the current user most recently interacted with.
 * Uses the latest ActivityLog created by this user on any tree they have access to.
 * Falls back to `null` when the user has no activity logs.
 * Auth required.
 */
export const getLastActiveTree = cache(async () => {
  try {
    const userId = await assertAuthenticated()

    const log = await db.activityLog.findFirst({
      where: {
        createdBy: userId,
        tree: { accesses: { some: { userId } } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tree: {
          include: { _count: { select: { nodes: true } } },
        },
      },
    })

    if (!log?.tree) return null
    return { tree: log.tree, lastActivityAt: log.createdAt }
  } catch (error) {
    throw error
  }
})

/**
 * Get a tree by slug that the current user has access to.
 * Auth required.
 * @param slug Tree slug
 * @returns Promise<Tree | null>
 */
export const getTree = cache(async (slug: string) => {
  try {
    const userId = await assertAuthenticated()

    const tree = await db.tree.findFirst({
      where: { slug, accesses: { some: { userId } } },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })

    return tree
  } catch (error) {
    throw error
  }
})

/**
 * Get a tree tree by its slug.
 * Auth required.
 * @param slug Tree slug
 * @returns Promise<{ tree: Tree; nodes: TreeNode[]; edges: TreeEdge[] } | { error: true; message: string } >
 */
export const getTreeRoots = cache(async (slug: string) => {
  try {
    const userId = await assertAuthenticated()

    const tree = await db.tree.findFirst({
      where: { slug, accesses: { some: { userId } } },
      include: {
        accesses: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    })

    if (!tree) return { error: true, message: 'error-tree-not-found' }

    const nodes = await db.treeNode.findMany({
      where: { treeId: tree.id },
      include: { taggedIn: { where: { isProfile: true }, include: { picture: true } } },
      orderBy: [{ birthDate: 'asc' }, { createdAt: 'asc' }],
    })

    const typedNodes = nodes.map((node) => ({
      ...node,
      taggedIn: node.taggedIn.map((tag) => ({
        ...tag,
        picture: {
          ...tag.picture,
          metadata: tag.picture.metadata as unknown as PictureMetadata,
        },
      })),
    }))
    const edges = await db.treeEdge.findMany({ where: { treeId: tree.id } })

    return { tree, nodes: typedNodes, edges }
  } catch (error) {
    throw error
  }
})

/**
 * Get the shared note for a tree (singleton per tree).
 * Returns the note content, last-edit metadata, and whether the current user
 * can edit. Note row does not have to exist yet — returns empty content when
 * missing. Auth required.
 */
export const getTreeNote = cache(async (slug: string) => {
  try {
    const userId = await assertAuthenticated()

    const tree = await db.tree.findFirst({
      where: { slug, accesses: { some: { userId } } },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        accesses: { where: { userId }, select: { role: true } },
        note: {
          include: {
            updatedBy: { select: { id: true, name: true, image: true } },
          },
        },
      },
    })

    if (!tree) return { error: true as const, message: 'error-tree-not-found' as const }

    const role = tree.accesses[0]?.role
    const canEdit = role === 'EDITOR' || role === 'ADMIN'

    return {
      error: false as const,
      currentUserId: userId,
      canEdit,
      tree: { id: tree.id, slug: tree.slug, name: tree.name, type: tree.type },
      note: {
        content: tree.note?.content ?? '',
        updatedAt: tree.note?.updatedAt ?? null,
        updatedBy: tree.note?.updatedBy ?? null,
      },
    }
  } catch (error) {
    throw error
  }
})

/**
 * Get the latest activity logs for the specified tree
 * Auth required.
 * @param treeId Tree ID
 * @returns Promise<{ logs: ActivityLog[]}>
 */
export const getTreeActivityLogs = cache(async (slug: string) => {
  try {
    const userId = await assertAuthenticated()

    const logs = await db.activityLog.findMany({
      where: { tree: { slug, accesses: { some: { userId } } } },
      include: {
        tree: true,
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return { logs: logs }
  } catch (error) {
    throw error
  }
})
