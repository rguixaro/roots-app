import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { auth } from '@/auth'

import { ActivityFeed } from '@/components/trees'

import { TypographyH4 } from '@/ui'

export default async function TreeLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const session = await auth()
  if (!session) return null

  const { slug } = await params
  const { page: pageParam } = await searchParams
  const pageValue = Array.isArray(pageParam) ? pageParam[0] : pageParam
  const page = Number.parseInt(pageValue ?? '1', 10)

  if (!slug) {
    const t_common = await getTranslations('common')
    return (
      <div className="text-ocean-200 mt-32 flex flex-col items-center justify-center">
        <FileQuestion size={24} />
        <TypographyH4 className="mt-2 mb-5">{t_common('tree-not-found')}</TypographyH4>
        <Link href="/" className="mt-5 font-medium underline decoration-dotted underline-offset-4">
          {t_common('return')}
        </Link>
      </div>
    )
  }

  return await ActivityFeed(slug, Number.isNaN(page) ? 1 : page)
}
