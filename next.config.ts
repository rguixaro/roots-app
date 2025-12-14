import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const assetsUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN
const assetsHostname = assetsUrl ? new URL(assetsUrl).hostname : undefined

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: { bodySizeLimit: '20mb' },
  },
  images: {
    remotePatterns: assetsHostname
      ? [
          {
            protocol: 'https',
            hostname: assetsHostname,
          },
        ]
      : [],
  },
}

export default withNextIntl(nextConfig)
