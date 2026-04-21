import type { MetadataRoute } from 'next'

import { CA_SITE_URL, DEFAULT_SITE_URL, getLanguageAlternates } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: `${DEFAULT_SITE_URL}/auth`,
      lastModified,
      changeFrequency: 'monthly',
      alternates: {
        languages: getLanguageAlternates('/auth'),
      },
    },
    {
      url: `${CA_SITE_URL}/auth`,
      lastModified,
      changeFrequency: 'monthly',
      alternates: {
        languages: getLanguageAlternates('/auth'),
      },
    },
  ]
}
