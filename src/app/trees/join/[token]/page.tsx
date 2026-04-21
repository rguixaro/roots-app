import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { joinTreeViaShareToken } from '@/server/actions/trees'

import { JoinError } from './join-error'

export const metadata: Metadata = {
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await joinTreeViaShareToken(token)

  if (!result.error && result.slug) redirect(`/trees/${result.slug}`)

  const t = await getTranslations('share')
  const t_common = await getTranslations('common')

  const reasonKey: 'error-expired' | 'error-invalid' | 'error-generic' =
    result.message === 'error-share-token-expired'
      ? 'error-expired'
      : result.message === 'error-share-token-invalid'
        ? 'error-invalid'
        : 'error-generic'

  return <JoinError title={t(reasonKey)} returnText={t_common('return')} />
}
