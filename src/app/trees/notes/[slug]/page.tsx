import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'
import { getTreeNote } from '@/server/queries'

import { TreeNotesHeader, TreeNotesEditor } from '@/components/trees/notes'

import { GoBack } from '@/components/layout'

import { TypographyH4 } from '@/ui'

export default async function TreeNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const session = await auth()
  if (!session) return null

  const t_common = await getTranslations('common')
  const { slug } = await params
  const { from } = await searchParams

  const result = await getTreeNote(slug)

  if (result.error) {
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

  const { tree, note, canEdit } = result

  const backTo = from === 'view' ? `/trees/view/${tree.slug}` : `/trees/${tree.slug}`

  return (
    <div className="text-ocean-400 z-0 flex w-full flex-col">
      <GoBack variant="filled" to={backTo} className="w-auto" />
      <TreeNotesHeader updatedAt={note.updatedAt} updatedBy={note.updatedBy} />
      <TreeNotesEditor treeId={tree.id} initialContent={note.content} canEdit={canEdit} />
    </div>
  )
}
