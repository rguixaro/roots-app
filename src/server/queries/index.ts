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
 * Get the latest activity logs for the specified tree
 * Auth required.
 * @param treeId Tree ID
 * @returns Promise<{ logs: ActivityLog[]}>
 */
export const getTreeActivityLogs = cache(async (slug: string) => {
  try {
    await assertAuthenticated()

    const logs = await db.activityLog.findMany({
      where: { tree: { slug: slug } },
      include: { tree: true, user: true },
      orderBy: { createdAt: 'desc' },
    })
    return { logs: logs }
  } catch (error) {
    throw error
  }
})
