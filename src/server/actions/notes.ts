'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'

import { db } from '@/server/db'
import { assertAuthenticated, assertRole } from '@/server/utils'
import { UpdateTreeNoteSchema } from '@/server/schemas'

/**
 * How long (in minutes) to debounce NOTE_UPDATED activity log entries by the
 * same user on the same tree. Multiple saves within this window by the same
 * user only write one log entry to keep the activity feed useful.
 */
const ACTIVITY_LOG_DEBOUNCE_MIN = 10

/**
 * Create or update the singleton shared note for a tree.
 * Auth + EDITOR/ADMIN role required.
 *
 * Writes a debounced NOTE_UPDATED activity log — consecutive saves by the same
 * user within ACTIVITY_LOG_DEBOUNCE_MIN minutes only produce a single log entry.
 */
export const updateTreeNote = async (
  input: { treeId: string; content: string }
): Promise<{ error: boolean; message?: string }> => {
  try {
    const userId = await assertAuthenticated()

    const parsed = UpdateTreeNoteSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'error'
      return { error: true, message }
    }

    const { treeId, content } = parsed.data

    const tree = await db.tree.findUnique({ where: { id: treeId }, select: { id: true, slug: true } })
    if (!tree) return { error: true, message: 'error-tree-not-found' }

    await assertRole(treeId, userId, ['EDITOR', 'ADMIN'])

    // Upsert by unique treeId — first edit creates the row, subsequent edits update it.
    await db.treeNote.upsert({
      where: { treeId },
      create: { treeId, content, updatedById: userId },
      update: { content, updatedById: userId },
    })

    // Debounced activity log — skip if this user already logged a NOTE_UPDATED
    // on this tree within the debounce window.
    const since = new Date(Date.now() - ACTIVITY_LOG_DEBOUNCE_MIN * 60 * 1000)
    const recent = await db.activityLog.findFirst({
      where: {
        treeId,
        createdBy: userId,
        action: 'NOTE_UPDATED',
        createdAt: { gte: since },
      },
      select: { id: true },
    })
    if (!recent) {
      await db.activityLog.create({
        data: {
          treeId,
          createdBy: userId,
          action: 'NOTE_UPDATED',
          entityId: treeId,
          metadata: { charCount: content.length },
        },
      })
    }

    revalidatePath(`/trees/notes/${tree.slug}`)

    return { error: false }
  } catch (e: any) {
    if (e?.message === 'error-no-permission') return { error: true, message: e.message }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return { error: true, message: 'error-tree-not-found' }
    }
    Sentry.captureException(e, { tags: { action: 'updateTreeNote' } })
    return { error: true, message: 'error' }
  }
}
