import { getFamilies } from '@/server/queries'

import { ItemFamily } from '@/components/families'

import { cn } from '@/utils/cn'

import { Family } from '@/types'

export const FamiliesFeed = async () => {
  const families = (await getFamilies())?.families
  const familiesWithAdd = [...(families ?? []), null as Family | null]

  return (
    <div className={cn('flex h-full w-full flex-col rounded-lg py-5')}>
      <div className={cn('no-scrollbar flex w-full justify-start overflow-x-auto')}>
        <div className="flex w-max flex-row gap-4">
          {familiesWithAdd.map((item, i) => (
            <ItemFamily key={i} family={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
