import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'

import { getTreeInfo } from '@/server/actions'

import { NotFoundClient } from '@/components/layout'
import {
  TreeInfoHubToolbar,
  TreeInfoHeader,
  TreeInfoShareDownload,
  TreeInfoDemographics,
  TreeInfoGenerations,
  TreeInfoRelationships,
  TreeInfoLifeStats,
  TreeInfoPlaces,
  TreeInfoPictures,
  TreeInfoCompleteness,
  TreeInfoUpcomingEvents,
  TreeInfoCollaborators,
} from '@/components/trees/info'

import { TreeAccessRole } from '@/types'

export default async function TreePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return null

  const { slug } = await params
  const t_common = await getTranslations('common')

  const result = await getTreeInfo(slug)

  if ('error' in result) {
    return (
      <NotFoundClient pageNotFound={t_common('page-not-found')} returnText={t_common('return')} />
    )
  }

  const info = result
  const myAccess = info.collaborators.list.find((c) => c.id === session.user?.id)
  const role: TreeAccessRole = myAccess?.role ?? 'VIEWER'

  return (
    <main className="flex flex-col items-start justify-center pb-12">
      <div className="mx-auto w-11/12 max-w-6xl self-center">
        <TreeInfoHubToolbar slug={info.tree.slug} role={role} />
        <div className="mt-6 space-y-6">
          <TreeInfoHeader info={info} />
          <TreeInfoShareDownload
            treeId={info.tree.id}
            slug={info.tree.slug}
            canShare={role !== 'VIEWER' && !info.tree.deletionRequest}
            canExportData={role === 'ADMIN'}
            canExportGallery={role === 'EDITOR' || role === 'ADMIN'}
          />
          <TreeInfoDemographics info={info} />
          <TreeInfoGenerations info={info} />
          <TreeInfoRelationships info={info} />
          <TreeInfoLifeStats info={info} />
          <TreeInfoPlaces info={info} />
          <TreeInfoPictures info={info} />
          <TreeInfoUpcomingEvents info={info} />
          <TreeInfoCompleteness info={info} />
          <TreeInfoCollaborators info={info} />
        </div>
      </div>
    </main>
  )
}
