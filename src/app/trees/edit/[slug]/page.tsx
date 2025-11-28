import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { auth } from '@/auth'
import { getTree } from '@/server/queries'
import { EditTree } from '@/components/trees/form'
import { TypographyH4 } from '@/ui'

export default async function TreeEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return null

  const t_common = await getTranslations('common')

  const { slug } = await params
  const tree = await getTree(slug)

  if (!tree) {
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

  return <EditTree userId={session.user.id!} tree={tree} />
}
