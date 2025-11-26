import { cache } from 'react'

import { db } from '@/server/db'
import { assertAuthenticated } from '@/server/utils/auth'

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
      include: { accesses: true },
    })
    return { trees: trees }
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
      include: { accesses: { include: { user: true } } },
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
 * @returns Promise<TreeResult>
 */
export const getTreeRoots = cache(async (slug: string) => {
  try {
    const userId = await assertAuthenticated()

    const tree = await db.tree.findFirst({
      where: { slug, accesses: { some: { userId } } },
      include: { accesses: { include: { user: true } } },
    })

    if (!tree) return { error: true, message: 'error-tree-not-found' }

    const nodes = await db.treeNode.findMany({
      where: { treeId: tree.id },
      include: { taggedIn: { where: { isProfile: true }, include: { picture: true } } },
    })
    const edges = await db.treeEdge.findMany({ where: { treeId: tree.id } })

    return { tree, nodes, edges }
  } catch (error) {}
})

/**
 * Get the latest activity logs for trees the current user has access to.
 * Auth required.
 * @returns Promise<{ logs: ActivityLog[], trees: Tree[] }>
 */
export const getActivityLogs = cache(async () => {
  try {
    const userId = await assertAuthenticated()

    const trees = await db.tree.findMany({ where: { accesses: { some: { userId: userId } } } })
    const logs = await db.activityLog.findMany({
      where: { treeId: { in: trees.map((t) => t.id) } },
      include: { tree: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return { logs: logs }
  } catch (error) {
    throw error
  }
})
