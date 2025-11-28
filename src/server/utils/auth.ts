import { auth } from '@/auth'

/**
 * Assert that the user is authenticated.
 * @returns Promise<string | { error: true }>
 */
export const assertAuthenticated = async () => {
  const currentUser = await auth()
  const userId = currentUser?.user?.id
  if (!userId) throw { error: true }
  return userId
}
