import { getTranslations } from 'next-intl/server'

import { getTrees } from '@/server/queries'

import { ItemTree } from '@/components/trees'

import { Tree } from '@/types'

export const TreesFeed = async () => {
  const t_common = await getTranslations('common')

  const trees = (await getTrees())?.trees
  const treesWithAdd = [null as Tree | null, ...(trees ?? [])]

  return (
    <div className="flex h-full w-full flex-col">
      <div className="w-3/4 self-center sm:w-3/4">
        <div className="text-ocean-400 flex h-full items-center justify-center">
          <div className="h-full w-full sm:w-4/5 md:w-3/5">
            <p className="text-ocean-400 mt-2 mb-4">{t_common('trees-description')}</p>
          </div>
        </div>
      </div>
      <div className="no-scrollbar mx-auto w-full overflow-x-auto overflow-y-hidden sm:w-[90%] md:w-[75%] lg:w-[65%] xl:w-[55%]">
        <div className="flex w-max flex-row gap-2 px-4">
          {treesWithAdd.map((item, i) => (
            <ItemTree key={i} tree={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
