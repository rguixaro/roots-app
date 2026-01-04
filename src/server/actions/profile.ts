'use server'

import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { signOut } from '@/auth'
import { db } from '@/server/db'
import type { UpdateProfileSchema } from '@/server/schemas'
import { assertAuthenticated } from '@/server/utils'

/**
 * Update Profile.
 * Auth required.
 * @param values {z.infer<typeof UpdateProfileSchema>}
 * @returns Promise<void | null>
 */
export const updateProfile = async (
  values: z.infer<typeof UpdateProfileSchema>
): Promise<void | null> => {
  const userId = await assertAuthenticated()

  await db.user.update({ where: { id: userId }, data: { ...values } })

  revalidatePath('/')
  revalidatePath('/profile')

  return
}

/**
 * Delete Profile.
 * Auth required.
 * Handles tree cleanup:
 * - Deletes trees where user is the only member
 * - Transfers ownership to another admin (or editor if no admin exists) for shared trees
 * @returns Promise<null | true>
 */
export const deleteProfile = async (): Promise<null | true> => {
  const userId = await assertAuthenticated()

  const userTreeAccesses = await db.treeAccess.findMany({
    where: { userId },
    include: { tree: { include: { accesses: { include: { user: true } } } } },
  })

  for (const access of userTreeAccesses) {
    const tree = access.tree
    const otherMembers = tree.accesses.filter((a) => a.userId !== userId)

    if (otherMembers.length === 0) {
      await db.tree.delete({ where: { id: tree.id } })
    } else {
      if (access.role === 'ADMIN') {
        let newAdmin = otherMembers.find((a) => a.role === 'ADMIN')
        if (!newAdmin) newAdmin = otherMembers.find((a) => a.role === 'EDITOR')
        if (!newAdmin) newAdmin = otherMembers[0]

        if (newAdmin)
          await db.treeAccess.update({ where: { id: newAdmin.id }, data: { role: 'ADMIN' } })
      }
    }
  }

  await db.user.delete({ where: { id: userId } })
  await signOut()

  return true
}
