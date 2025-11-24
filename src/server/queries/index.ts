import { cache } from 'react'

import { auth } from '@/auth'

import { db } from '@/server/db'

/**
 * Get trees that a user has access to.
 * Auth required.
 * @param userId optional, if not provided uses current user
 * @returns Promise<{ trees: Tree[] } | null>
 */
export const getTrees = cache(async () => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  /** Not authenticated */
  if (!userId) return null

  try {
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
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  /** Not authenticated */
  if (!userId) return null

  try {
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
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  /** Not authenticated */
  if (!userId) return null

  try {
    const tree = await db.tree.findFirst({
      where: { slug, accesses: { some: { userId } } },
      include: { accesses: { include: { user: true } } },
    })

    if (!tree) return { error: true, message: 'error-tree-not-found' }

    const nodes = await db.treeNode.findMany({
      where: { treeId: tree.id },
      include: {
        taggedIn: {
          where: { isProfile: true },
          include: { picture: true },
        },
      },
    })
    const edges = await db.treeEdge.findMany({ where: { treeId: tree.id } })

    return { tree, nodes, edges }
  } catch (error) {}
})

/**
 * Get profile by user id.
 * Auth required.
 * @param userId User id
 * @returns Promise<{ profile: { name: string, image: string } | null; }>
 */
export const getUserProfile = cache(
  async (
    userId: string
  ): Promise<{
    profile: { name: string; image: string } | null
  }> => {
    const currentUser = await auth()

    /** Not authenticated */
    if (!currentUser) return { profile: null }

    try {
      const profile = await db.user.findFirst({
        where: { id: userId, isPrivate: false },
        select: { image: true, name: true },
      })
      return { profile }
    } catch (error) {
      return { profile: null }
    }
  }
)
