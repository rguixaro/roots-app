import { API_AUTH_PREFIX, AUTH_ROUTES, PROTECTED_ROUTES, TREES_ROUTE_PREFIX } from '@/routes'

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

/**
 * Normalize a given path by removing trailing slashes, except for the root path.
 * @param p {string} - The path to normalize
 * @returns {string} - The normalized path
 */
export function normalizePath(p: string): string {
  if (!p) return '/'
  return p === '/' ? '/' : p.replace(/\/+$/, '')
}

/**
 * Determine if the current route is a tree detail route
 * @param pathname {string} - The current pathname
 * @returns {boolean} - True if it's a tree detail route, false otherwise
 */
export function isTreeDetailRoute(pathname: string): boolean {
  const p = normalizePath(pathname)
  return /^\/trees\/[^\/]+$/.test(p) && !p.includes('/edit') && !p.includes('/new')
}

/**
 * Determine if the given pathname is a known route
 * @param pathname {string} - The current pathname
 * @returns {boolean} - True if it's a known route, false otherwise
 */
export function isKnownRoute(pathname: string): boolean {
  const p = normalizePath(pathname)

  if (AUTH_ROUTES.includes(p) || PROTECTED_ROUTES.includes(p)) return true

  if (p.startsWith(TREES_ROUTE_PREFIX)) {
    if (isTreeDetailRoute(p)) return true
    return true
  }

  if (p.startsWith(API_AUTH_PREFIX)) return true

  return false
}
