'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'
import type { z } from 'zod'

import { signOut } from '@/auth'
import { db } from '@/server/db'
import { UpdateProfileSchema } from '@/server/schemas'
import { assertAuthenticated } from '@/server/utils'

interface ProfileResult {
  error: boolean
  message?: string
}

/**
 * Update Profile.
 * Auth required.
 * @param values {z.infer<typeof UpdateProfileSchema>}
 * @returns Promise<ProfileResult>
 */
export const updateProfile = async (
  values: z.infer<typeof UpdateProfileSchema>
): Promise<ProfileResult> => {
  try {
    const userId = await assertAuthenticated()
    const { name, email, newsletter, language } = UpdateProfileSchema.parse(values)

    await db.user.update({ where: { id: userId }, data: { name, email, newsletter, language } })

    revalidatePath('/')
    revalidatePath('/profile')

    return { error: false }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { error: true, message: 'error-email-in-use' }
    }
    Sentry.captureException(e, { tags: { action: 'updateProfile' } })
    return { error: true, message: 'error' }
  }
}

/**
 * Delete Profile.
 * Auth required.
 * Handles tree cleanup:
 * - Deletes trees where user is the only member
 * - Transfers ownership to another admin (or editor if no admin exists) for shared trees
 * @returns Promise<null | true>
 */
export const deleteProfile = async (): Promise<ProfileResult> => {
  try {
    const userId = await assertAuthenticated()

    const userTreeAccesses = await db.treeAccess.findMany({
      where: { userId },
      include: { tree: { include: { accesses: { include: { user: true } } } } },
    })

    await db.$transaction(async (tx) => {
      for (const access of userTreeAccesses) {
        const tree = access.tree
        const otherMembers = tree.accesses.filter((a) => a.userId !== userId)

        if (otherMembers.length === 0) {
          await tx.tree.delete({ where: { id: tree.id } })
        } else {
          if (access.role === 'ADMIN') {
            let newAdmin = otherMembers.find((a) => a.role === 'ADMIN')
            if (!newAdmin) newAdmin = otherMembers.find((a) => a.role === 'EDITOR')
            if (!newAdmin) newAdmin = otherMembers[0]

            if (newAdmin)
              await tx.treeAccess.update({ where: { id: newAdmin.id }, data: { role: 'ADMIN' } })
          }
        }
      }

      await tx.user.delete({ where: { id: userId } })
    })

    await signOut()

    return { error: false }
  } catch (e) {
    Sentry.captureException(e, { tags: { action: 'deleteProfile' } })
    return { error: true, message: 'error' }
  }
}
