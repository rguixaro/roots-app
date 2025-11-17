import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Loader } from 'lucide-react'

import { FamiliesFeed, Toolbar } from '@/components/families'

export default async function FamiliesPage() {
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
    <main className="text-ocean-400 flex h-full items-center justify-center">
      <div className="w-3/4">
        <Toolbar withSearch={false} />
        <Suspense fallback={<LoadingSkeleton />}>
          <FamiliesFeed />
        </Suspense>
      </div>
    </main>
  )
}
