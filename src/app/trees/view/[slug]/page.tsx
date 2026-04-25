import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'
import { getTreeRoots } from '@/server/queries'

import { NotFoundClient } from '@/components/layout'
import { TreeWrapper } from '@/components/tree'

import { TypographyH4 } from '@/ui'

export default async function TreeViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return null

  const { slug } = await params

  const result = await getTreeRoots(slug)
  const t_errors = await getTranslations('errors')
  const t_common = await getTranslations('common')

  if (!result) return null

  if ('error' in result) {
    return (
      <NotFoundClient pageNotFound={t_common('page-not-found')} returnText={t_common('return')} />
    )
  }

  const { tree, nodes, edges, unions } = result
  const userAccess = tree?.accesses.find((a) => a.userId === session?.user?.id)
  const readonly = userAccess?.role === 'VIEWER' || !!tree.deletionRequest
  const canExportGallery = userAccess?.role === 'EDITOR' || userAccess?.role === 'ADMIN'

  return (
    <div className="h-full w-full text-center">
      {!tree ? (
        <div className="text-ocean-200 mt-10 flex h-32 flex-col items-center justify-center">
          <TypographyH4>{t_errors('error-tree-not-found')}</TypographyH4>
        </div>
      ) : (
        <div className="bg-ocean-200/15 h-full w-full shadow-inner">
          <TreeWrapper
            readonly={readonly}
            canExportGallery={canExportGallery}
            tree={tree}
            nodes={nodes}
            edges={edges}
            unions={unions}
          />
        </div>
      )}
    </div>
  )
}
