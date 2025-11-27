import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { auth } from '@/auth'

import { ActivityFeed } from '@/components/trees/activity/feed'

import { TypographyH4 } from '@/ui'

export default async function TreeLogsPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return null

  const { slug } = await params

  if (!slug) {
    const t_common = await getTranslations('common')
    return (
      <div className="text-ocean-200 mt-32 flex flex-col items-center justify-center">
        <FileQuestion size={24} />
        <TypographyH4 className="mt-2 mb-5">{t_common('tree-not-found')}</TypographyH4>
        <Link href="/" className="mt-5 font-medium underline">
          {t_common('return')}
        </Link>
      </div>
    )
  }

  return await ActivityFeed(slug)
}
