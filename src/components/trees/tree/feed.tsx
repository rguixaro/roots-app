import { getTranslations } from 'next-intl/server'

import { getTrees } from '@/server/queries'

import { ItemTree } from '@/components/trees'

import { Tree } from '@/types'

export const TreesFeed = async () => {
  const t_common = await getTranslations('common')

  const trees = (await getTrees())?.trees
  const treesWithAdd = [...(trees ?? []), null as Tree | null]

  return (
    <div className="flex h-full w-full flex-col">
      <p className="mt-2 mb-4">{t_common('trees-description')} </p>
      <div className="no-scrollbar flex w-full justify-start overflow-x-auto">
        <div className="flex w-max flex-row gap-2">
          {treesWithAdd.map((item, i) => (
            <ItemTree key={i} tree={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
