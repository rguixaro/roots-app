import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Loader } from 'lucide-react'

import { TreesFeed, ActivityFeed, Toolbar } from '@/components/trees'

export default async function TreesPage() {
  const t_common = await getTranslations('common')

  const LoadingSkeleton = () => {
    return (
      <div className="text-ocean-200 mt-5 flex flex-col items-center justify-center">
        <Loader size={18} className="animate-spin" />
        <span className="mt-3 font-bold">{t_common('searching')}</span>
      </div>
    )
  }

  return (
    <main className="flex items-start justify-center">
      <div className="w-3/4 sm:w-2/4">
        <div className="text-ocean-400 flex h-full items-center justify-center">
          <div className="h-full w-3/4">
            <Toolbar />
            <Suspense fallback={<LoadingSkeleton />}>
              <TreesFeed />
              <div className="mx-auto mb-5 w-5/6 items-center justify-center">
                <div className="bg-ocean-100 h-1 rounded shadow-lg" />
              </div>
              <ActivityFeed />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
