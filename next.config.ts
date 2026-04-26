import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import packageJson from './package.json'

const withNextIntl = createNextIntlPlugin()

const assetsUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN
const publicImagesEnabled = process.env.NEXT_PUBLIC_IMAGES_ENABLED !== 'false'
const assetsHostname = publicImagesEnabled && assetsUrl ? new URL(assetsUrl).hostname : undefined

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: packageJson.version },
  poweredByHeader: false,
  pageExtensions: ['ts', 'tsx'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: { bodySizeLimit: '50mb' },
  },
  images: {
    remotePatterns: assetsHostname ? [{ protocol: 'https', hostname: assetsHostname }] : [],
    localPatterns: assetsHostname ? [{ pathname: `/assets/**` }, { pathname: `/api/proxy` }] : [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https://lh3.googleusercontent.com${publicImagesEnabled && assetsUrl ? ` ${assetsUrl}` : ''}`,
              "font-src 'self'",
              `connect-src 'self'${publicImagesEnabled && assetsUrl ? ` ${assetsUrl}` : ''} *.sentry.io${process.env.NODE_ENV === 'development' ? ' ws://127.0.0.1:* ws://localhost:*' : ''}`,
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG,

  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",
})
