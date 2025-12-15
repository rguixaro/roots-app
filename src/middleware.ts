import { NextResponse } from 'next/server'
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
  const { nextUrl } = req
  const { pathname, search, origin, href } = nextUrl

  const isLoggedIn = Boolean(req.auth)

  const isApiAuthRoute = nextUrl.pathname.startsWith(API_AUTH_PREFIX)
  const isProtectedRoute = PROTECTED_ROUTES.includes(nextUrl.pathname)
  const isAuthRoute = AUTH_ROUTES.includes(nextUrl.pathname)
  const isTreeRoute = nextUrl.pathname.startsWith(TREES_ROUTE_PREFIX)
  const isSettingsRoute = nextUrl.pathname.startsWith('/profile')

  /// API Route
  if (isApiAuthRoute) return NextResponse.next()

  /// Auth Route
  if (isAuthRoute) {
    return isLoggedIn
      ? NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT_URL, origin))
      : NextResponse.next()
  }

  /// Protected route
  if (!isLoggedIn && (isProtectedRoute || isTreeRoute)) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`)
    return NextResponse.redirect(new URL(`/auth?callbackUrl=${callbackUrl}`, origin))
  }

  /// CloudFront cookies for authenticated users
  if (isLoggedIn && !isSettingsRoute) {
    const hasCloudFrontCookies =
      req.cookies.has('CloudFront-Key-Pair-Id') &&
      req.cookies.has('CloudFront-Policy') &&
      req.cookies.has('CloudFront-Signature')

    if (!hasCloudFrontCookies) {
      const cookiesUrl = `${origin}/api/cookies?return=${encodeURIComponent(href)}`
      return NextResponse.redirect(cookiesUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/|_next/|images/|docs/|_proxy/|_static|_vercel|[\\w-]+\\.\\w+).*)',
    '/s/:slug*',
  ],
}
