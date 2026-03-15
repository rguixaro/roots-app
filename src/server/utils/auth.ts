import { auth } from '@/auth'

/**
 * Assert that the user is authenticated.
 * @returns Promise<string> The authenticated user's ID
 * @throws {Error} If the user is not authenticated
 */
export const assertAuthenticated = async () => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id
  if (!userId) throw new Error('unauthenticated')
  return userId
}
