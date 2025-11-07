/**
 * Routes used for authentication.
 * Auth not required.
 */
export const AUTH_ROUTES: string[] = [
	'/auth',
	'/register',
	'/auth-error',
	'/verify',
	'/reset',
	'/new-password',
]

/**
 * Routes that require authentication.
 * Auth required.
 */
export const PROTECTED_ROUTES: string[] = [
	'/',
	'/profile',
	'/families',
	'/families/new',
]

/**
 * Families routes prefix.
 * Auth required.
 */
export const FAMILIES_ROUTE_PREFIX: string = '/families/'

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
