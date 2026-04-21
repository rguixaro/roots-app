import type { MetadataRoute } from 'next'

import { getRequestSiteUrl } from '@/lib/seo'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getRequestSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/auth'],
        disallow: ['/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
