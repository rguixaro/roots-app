import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { auth } from '@/auth'

import { getTimelineEvents } from '@/server/actions'

import { Timeline } from '@/components/trees'

import { TypographyH4 } from '@/ui'

export default async function TreeTimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return null

  const { slug } = await params

  if (!slug) {
    const t_common = await getTranslations('common')
    return (
      <div className="text-ocean-200 mt-32 flex w-3/4 flex-col items-center justify-center sm:w-3/4">
        <FileQuestion size={24} />
        <TypographyH4 className="mt-2 mb-5">{t_common('tree-not-found')}</TypographyH4>
        <Link href="/" className="mt-5 font-medium underline decoration-dotted underline-offset-4">
          {t_common('return')}
        </Link>
      </div>
    )
  }

  const events = (await getTimelineEvents(slug)) ?? {}

  return <Timeline events={events} slug={slug} />
}
