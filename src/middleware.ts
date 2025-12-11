import { NextResponse, NextRequest } from 'next/server'
import NextAuth from 'next-auth'

import AuthConfig from './auth.config'
import {
  DEFAULT_AUTH_REDIRECT_URL,
  TREES_ROUTE_PREFIX,
  API_AUTH_PREFIX,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
} from './routes'

const { auth } = NextAuth(AuthConfig)

/**
 * Middleware to handle the routing flow and CloudFront cookies.
 * @param req {NextRequest} The incoming request object.
 * @returns {NextResponse} The response object.
 */
export default auth(async (req) => {
  const { nextUrl: NextURL } = req

  const isLoggedIn = !!req.auth

  const isApiAuthRoute = NextURL.pathname.startsWith(API_AUTH_PREFIX)
  const isProtectedRoute = PROTECTED_ROUTES.includes(NextURL.pathname)
  const isAuthRoute = AUTH_ROUTES.includes(NextURL.pathname)
  const isTreeRoute = NextURL.pathname.startsWith(TREES_ROUTE_PREFIX)

  /// If this is an OAuth callback (has 'state' or 'code' params)
  const isOAuthCallback = NextURL.searchParams.has('state') || NextURL.searchParams.has('code')

  /// API Route
  if (isApiAuthRoute) return NextResponse.next()

  /// Auth Route
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT_URL, NextURL))
    return NextResponse.next()
  }

  /// Protected route
  if (!isLoggedIn && (isProtectedRoute || isTreeRoute)) {
    let callbackURL = NextURL.pathname
    if (NextURL.search) callbackURL += NextURL.search
    const encodedCallbackURL = encodeURIComponent(callbackURL)
    return NextResponse.redirect(new URL(`/auth?callbackUrl=${encodedCallbackURL}`, NextURL))
  }

  /// CloudFront cookies for authenticated users
  if (isLoggedIn && !isOAuthCallback) {
    const hasCookies =
      req.cookies.get('CloudFront-Key-Pair-Id') &&
      req.cookies.get('CloudFront-Policy') &&
      req.cookies.get('CloudFront-Signature')

    if (!hasCookies) {
      const returnTo = req.nextUrl.pathname + req.nextUrl.search
      const cookiesUrl = `${req.nextUrl.origin}/api/cookies?return=${encodeURIComponent(returnTo)}`
      return NextResponse.redirect(cookiesUrl)
    }
  }

  /// Default: proceed to the requested route
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/|_next/|images/|docs/|_proxy/|_static|_vercel|[\\w-]+\\.\\w+).*)',
    '/s/:slug*',
  ],
}
