import { Picture, TreeNode } from '@/types'

/**
 * Utility function to validate email format
 * @param email {string}
 * @returns {boolean}
 */
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

/**
 * onKeyDown handler to prevent form submission on Enter key
 * @param event {React.KeyboardEvent<HTMLFormElement>}
 */
export const checkKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
  if (event.key === 'Enter') event.preventDefault()
}

/**
 * Get the profile picture URL from a TreeNode
 * @param node {TreeNode}
 * @returns {Picture | null}
 */
export const getProfilePicture = (node: TreeNode): Picture | null => {
  return node?.taggedIn?.find((tag) => tag.isProfile)?.picture ?? null
}
