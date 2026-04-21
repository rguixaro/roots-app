import type { MetadataRoute } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t_common = await getTranslations('common')
  const name = t_common('app-name')
  const description = t_common('app-description')

  return {
    name,
    short_name: name,
    description,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f0f9ff',
    theme_color: '#0c4a6e',
    categories: ['lifestyle', 'social', 'productivity'],
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/favicon.png',
        sizes: '2731x2731',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
