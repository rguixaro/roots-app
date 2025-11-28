import { getTranslations } from 'next-intl/server'
import { Utensils } from 'lucide-react'

import { auth } from '@/auth'
import { getTreeRoots } from '@/server/queries'

import { GoBack } from '@/components/layout'
import { TreeWrapper } from '@/components/tree'

import { TypographyH4 } from '@/ui'

export default async function TreePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return null

  const { slug } = await params

  const result = await getTreeRoots(slug)
  const t_errors = await getTranslations('errors')

  if (!result) return null

  if ('error' in result) {
    return (
      <div className="mt-2 flex flex-col pt-2 text-center">
        <GoBack text={'trees'} className="px-8 md:px-10 lg:px-32 xl:px-52 2xl:px-64" />
        <div className="text-ocean-200 mt-10 flex h-32 flex-col items-center justify-center">
          <TypographyH4>{t_errors('error-tree-not-found')}</TypographyH4>
          <Utensils size={24} className="mt-2 mb-5" />
        </div>
      </div>
    )
  }

  const { tree, nodes, edges } = result
  const userAccess = tree?.accesses.find((a) => a.userId === session?.user?.id)
  const readonly = userAccess?.role === 'VIEWER'

  return (
    <div className="h-full w-full text-center">
      {!tree ? (
        <div className="text-ocean-200 mt-10 flex h-32 flex-col items-center justify-center">
          <TypographyH4>{t_errors('error-tree-not-found')}</TypographyH4>
        </div>
      ) : (
        <div className="bg-ocean-200/15 border-ocean-100 h-full w-full border-12 shadow-inner">
          <TreeWrapper readonly={readonly} tree={tree} nodes={nodes} edges={edges} />
        </div>
      )}
    </div>
  )
}
