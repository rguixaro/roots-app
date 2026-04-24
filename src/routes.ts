/**
 * Routes used for authentication.
 * Auth not required.
 */
export const AUTH_ROUTES: string[] = ['/auth', '/auth/error']

/**
 * Routes that require authentication.
 * Auth required.
 */
export const PROTECTED_ROUTES: string[] = ['/', '/profile', '/trees', '/trees/new', '/about']

/**
 * Trees routes prefix.
 * Auth required.
 */
export const TREES_ROUTE_PREFIX: string = '/trees/'

/**
 * API Authentication routes prefix.
 * Auth not required.
 */
export const API_AUTH_PREFIX: string = '/api/auth'

/**
 * Default redirect URL.
 * Auth not required.
 */
export const DEFAULT_AUTH_REDIRECT_URL: string = '/'
