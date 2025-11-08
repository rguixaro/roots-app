import { cache } from 'react'

import { auth } from '@/auth'
import { db } from '@/server/db'

/**
 * Get families that a user has access to.
 * Auth required.
 * @param userId optional, if not provided uses current user
 * @returns Promise<{ families: Family[] } | null>
 */
export const getFamilies = cache(async () => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  /** Not authenticated */
  if (!userId) return null

  try {
    const families = await db.family.findMany({
      where: { accesses: { some: { userId: userId } } },
      include: { accesses: true },
    })
    return { families: families }
  } catch (error) {
    throw error
  }
})

/**
 * Get a family by slug that the current user has access to.
 * Auth required.
 * @param slug Family slug
 * @returns Promise<Family | null>
 */
export const getFamily = cache(async (slug: string) => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  /** Not authenticated */
  if (!userId) return null

  try {
    const family = await db.family.findFirst({
      where: { slug, accesses: { some: { userId } } },
      include: {
        accesses: {
          include: {
            user: true,
          },
        },
      },
    })

    return family
  } catch (error) {
    throw error
  }
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
