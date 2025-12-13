import { getTranslations } from 'next-intl/server'

import { TreesFeed, Milestones, Highlights } from '@/components/trees'
import { Settings } from '@/components/layout'

import { TypographyH4 } from '@/ui'

export default async function TreesPage() {
  const t_common = await getTranslations('common')

  return (
    <main className="flex flex-col items-start justify-center">
      <div className="w-3/4 self-center sm:w-3/4">
        <div className="text-ocean-400 flex h-full items-center justify-center">
          <div className="mb-5 h-full w-full sm:w-4/5 md:w-3/5">
            <div className="mt-5 flex w-full items-center justify-between">
              <TypographyH4>{t_common('trees')}</TypographyH4>
              <Settings />
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center self-center">
        <TreesFeed />
      </div>
      <div className="w-3/4 self-center sm:w-3/4">
        <div className="text-ocean-400 flex h-full items-center justify-center">
          <div className="mb-20 h-full w-full sm:w-4/5 md:w-3/5">
            <div className="mx-auto my-6 w-5/6 items-center justify-center">
              <div className="bg-ocean-100 shadow-center-sm h-1 rounded" />
            </div>
            <Milestones />
            <div className="mx-auto my-6 w-5/6 items-center justify-center">
              <div className="bg-ocean-100 shadow-center-sm h-1 rounded" />
            </div>
            <Highlights />
          </div>
        </div>
      </div>
    </main>
  )
}
