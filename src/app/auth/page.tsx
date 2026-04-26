import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { LoginClient } from '@/components/auth'
import { getLanguageAlternates, getRequestSiteUrl } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const t_login = await getTranslations('login')
  const t_common = await getTranslations('common')
  const siteUrl = await getRequestSiteUrl()

  const title = t_login('login-to') + ' ' + t_common('app-name')
  const description = t_common('app-description')

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    alternates: {
      canonical: '/auth',
      languages: getLanguageAlternates('/auth'),
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/auth`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function LoginPage() {
  const t_login = await getTranslations('login')
  const t_common = await getTranslations('common')

  return (
    <LoginClient
      loginTo={t_login('login-to')}
      loginName={t_common('app-name')}
      loginText={t_login('login-text')}
      buildYourTreeTitle={t_login('build-your-tree-title')}
      buildYourTreeDescription={t_login('build-your-tree-description')}
      shareMemoriesTitle={t_login('share-memories-title')}
      shareMemoriesDescription={t_login('share-memories-description')}
      privateAndSecureTitle={t_login('private-and-secure-title')}
      privateAndSecureDescription={t_login('private-and-secure-description')}
    />
  )
}
