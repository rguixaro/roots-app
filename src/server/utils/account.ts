import * as Sentry from '@sentry/nextjs'

import { db } from '@/server/db'

import { Account } from '@/types'

/**
 * Get an account by user id
 * @param userId {string}
 * @returns Promise<Account | null>
 */
export const getAccountByUserId = async (userId: string): Promise<Account | null> => {
  try {
    return await db.account.findFirst({ where: { userId } })
  } catch (error) {
    Sentry.captureException(error, { level: 'warning', tags: { action: 'getAccountByUserId' } })
    return null
  }
}
