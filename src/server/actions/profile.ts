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
 * @returns Promise<null | true>
 */
export const deleteProfile = async (): Promise<null | true> => {
  const userId = await assertAuthenticated()

  await db.user.delete({ where: { id: userId } })
  await signOut()

  return true
}
