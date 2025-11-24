import { NextResponse, NextRequest } from 'next/server'
import NextAuth from 'next-auth'

import AuthConfig from './auth.config'
import {
  DEFAULT_AUTH_REDIRECT_URL,
  FAMILIES_ROUTE_PREFIX,
  API_AUTH_PREFIX,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
} from './routes'

const { auth } = NextAuth(AuthConfig)

/**
 * Middleware to handle the routing flow.
 * @param req
 */
export default auth(async (req) => {
  const { nextUrl: NextURL } = req

  const isLoggedIn = !!req.auth

  const isApiAuthRoute = NextURL.pathname.startsWith(API_AUTH_PREFIX)
  const isProtectedRoute = PROTECTED_ROUTES.includes(NextURL.pathname)
  const isAuthRoute = AUTH_ROUTES.includes(NextURL.pathname)
  const isFamilyRoute = NextURL.pathname.startsWith(FAMILIES_ROUTE_PREFIX)

  /* Api Route */
  if (isApiAuthRoute) return

  /* Auth Route */
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT_URL, NextURL))
    return
  }

  /* Protected route */
  if (!isLoggedIn && (isProtectedRoute || isFamilyRoute)) {
    let callbackURL = NextURL.pathname
    if (NextURL.search) callbackURL += NextURL.search
    const encodedCallbackURL = encodeURIComponent(callbackURL)
    return NextResponse.redirect(new URL(`/auth?callbackUrl=${encodedCallbackURL}`, NextURL))
  }

  /* Public route */
  return
})

export const config = {
  matcher: [
    '/((?!api/|_next/|images/|docs/|_proxy/|_static|_vercel|[\\w-]+\\.\\w+).*)',
    '/s/:slug*',
  ],
}

export async function middleware(req: NextRequest) {
  // Skip for static files & public routes
  if (req.nextUrl.pathname.startsWith('/_next')) return NextResponse.next()
  if (req.nextUrl.pathname.startsWith('/api')) return NextResponse.next()
  if (req.nextUrl.pathname.startsWith('/auth')) return NextResponse.next()

  // Check if CloudFront cookies exist
  const hasCookies =
    req.cookies.get('CloudFront-Key-Pair-Id') &&
    req.cookies.get('CloudFront-Policy') &&
    req.cookies.get('CloudFront-Signature')

  if (!hasCookies) {
    const baseUrl = req.nextUrl.origin
    await fetch(`${baseUrl}/api/cookies`, { method: 'GET', credentials: 'include' })
  }

  return NextResponse.next()
}
