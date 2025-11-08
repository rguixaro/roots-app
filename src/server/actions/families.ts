'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

import { auth } from '@/auth'
import { db } from '@/server/db'
import type { CreateFamilySchema, FamilySchema, FamilyRoles } from '@/server/schemas'
import { slugify } from '@/server/utils'
import { Family } from '@/types'

interface createFamilyResult {
  error: boolean
  message?: string
}

/**
 * Create new family.
 * Auth required.
 * @param values {z.infer<typeof CreateFamilySchema>}
 * @returns Promise<createFamilyResult>
 */
export const createFamily = async (
  values: z.infer<typeof CreateFamilySchema>
): Promise<createFamilyResult> => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    await db.family.create({
      data: {
        slug: slugify(values.name),
        name: values.name,
        type: values.type,
        nodeImage: values.nodeImage ?? false,
        nodeGallery: values.nodeGallery ?? false,
        accesses: { create: { userId, role: 'ADMIN' } },
      },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return { error: true, message: 'error-family-exists' }
      }
    }
    return { error: true, message: 'error' }
  }

  revalidatePath('/')
  revalidatePath('/families')

  return { error: false }
}

/**
 * Update an existing family.
 * Auth required.
 * Only users with ADMIN or EDITOR role can update.
 * @param values {z.infer<typeof CreateFamilySchema>}
 * @returns Promise<{ error: boolean; message?: string; family?: Family }>
 */
export const updateFamily = async (
  id: string,
  userId: string,
  values: z.infer<typeof CreateFamilySchema>
): Promise<{ error: boolean; message?: string; family?: Family }> => {
  const currentUser = await auth()

  // Not authenticated
  if (!currentUser) return { error: true }

  try {
    // Check if the user has permission to edit
    const access = await db.familyAccess.findFirst({
      where: { familyId: id, userId, role: { in: ['ADMIN', 'EDITOR'] } },
    })

    if (!access) return { error: true }

    const family = await db.family.update({
      where: { id },
      data: {
        name: values.name,
        type: values.type,
        nodeImage: values.nodeImage,
        nodeGallery: values.nodeGallery,
        slug: slugify(values.name),
      },
      include: { accesses: { include: { user: true } } },
    })

    return { error: false, family: family || undefined }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return { error: true, message: 'error-family-exists' }
      }
    }
    return { error: true, message: 'error' }
  }
}

/**
 * Invite a user to a family.
 * Auth required.
 * Only users with ADMIN or EDITOR role can invite.
 * @param familyId Family ID
 * @param email User email
 * @param role FamilyRoles
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const inviteMember = async (
  familyId: string,
  email: string,
  role: FamilyRoles
): Promise<{ error: boolean; message?: string; family?: Family }> => {
  const currentUser = await auth()

  // Not authenticated
  if (!currentUser) return { error: true }

  try {
    // Find the user by email
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return { error: true, message: 'error-user-not-found' }

    const existing = await db.familyAccess.findFirst({
      where: { familyId, userId: user.id },
    })

    if (existing) return { error: true, message: 'error-user-already-in-family' }

    await db.familyAccess.create({ data: { familyId, userId: user.id, role } })

    const family = await db.family.findUnique({
      where: { id: familyId },
      include: { accesses: { include: { user: true } } },
    })

    return { error: false, family: family || undefined }
  } catch (e) {
    return { error: true, message: 'error' }
  }
}

/**
 * Remove a user from a family.
 * Auth required.
 * Only users with ADMIN or EDITOR role can remove members.
 * @param familyId Family ID
 * @param memberId User ID to remove
 * @returns Promise<{ error: boolean; message?: string }>
 */
export const removeMember = async (
  familyId: string,
  memberId: string
): Promise<{ error: boolean; message?: string; family?: Family }> => {
  const currentUser = await auth()
  const userId = currentUser?.user.id

  // Not authenticated
  if (!userId) return { error: true }

  try {
    await db.familyAccess.delete({ where: { familyId_userId: { familyId, userId: memberId } } })

    const updatedFamily = await db.family.findUnique({
      where: { id: familyId },
      include: { accesses: { include: { user: true } } },
    })

    return { error: false, family: updatedFamily ?? undefined }
  } catch (e) {
    return { error: true, message: 'error' }
  }
}
