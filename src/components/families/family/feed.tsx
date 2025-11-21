import { getTranslations } from 'next-intl/server'

import { getFamilies } from '@/server/queries'

import { ItemFamily } from '@/components/families'

import { Family } from '@/types'

export const FamiliesFeed = async () => {
  const t_common = await getTranslations('common')

  const families = (await getFamilies())?.families
  const familiesWithAdd = [...(families ?? []), null as Family | null]

  return (
    <div className="mb-5 flex h-full w-full flex-col">
      <p className="mt-2 mb-4">{t_common('families-description')} </p>
      <div className="no-scrollbar flex w-full justify-start overflow-x-auto">
        <div className="flex w-max flex-row gap-2">
          {familiesWithAdd.map((item, i) => (
            <ItemFamily key={i} family={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
