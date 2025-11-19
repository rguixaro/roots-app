import { getTranslations } from 'next-intl/server'

import { getFamilies } from '@/server/queries'

import { TypographyH5 } from '@/ui'

import { FamilyType } from '@/types'

import { ActivityItem } from './item'

export const ActivityFeed = async () => {
  const t_common = await getTranslations('common')

  const families = (await getFamilies())?.families

  return (
    <div>
      <div className="border-ocean-400 mt-5 w-fit border-b-2 font-bold">
        <TypographyH5>{t_common('recent-activity')}</TypographyH5>
      </div>
      {[FamilyType[0], FamilyType[1], FamilyType[0], FamilyType[1]]?.map((item, i) => {
        return (
          <div key={i}>
            <ActivityItem item={item} index={i} />
          </div>
        )
      })}
    </div>
  )
}
