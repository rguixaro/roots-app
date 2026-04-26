import { db } from '@/server/db'

/**
 * Check if a user has access to a tree with specific roles.
 * @param treeId
 * @param userId
 * @param roles
 * @returns Promise<TreeAccess | null>
 */
export const checkTreeAccess = async (
  treeId: string,
  userId: string,
  roles: ('EDITOR' | 'ADMIN')[] = ['EDITOR', 'ADMIN']
) => await db.treeAccess.findFirst({ where: { treeId, userId, role: { in: roles } } })

/**
 * Assert that a user has access to a tree with specific roles.
 * @param treeId
 * @param userId
 * @param roles
 * @returns Promise<void>
 */
export const assertRole = async (
  treeId: string,
  userId: string,
  roles: ('EDITOR' | 'ADMIN')[] = ['EDITOR', 'ADMIN']
) => {
  const access = await checkTreeAccess(treeId, userId, roles)
  if (!access) throw new Error('error-no-permission')
}

/**
 * Assert that a tree is not pending deletion before allowing mutations.
 * Read actions and deletion-request cancel/approval intentionally bypass this.
 * @param treeId
 * @returns Promise<void>
 */
export const assertTreeWritable = async (treeId: string) => {
  const request = await db.treeDeletionRequest.findUnique({
    where: { treeId },
    select: { id: true },
  })
  if (request) throw new Error('error-tree-pending-deletion')
}
