import { getTranslations } from 'next-intl/server'

import { getFamilies } from '@/server/queries'

import { TypographyH5 } from '@/ui'

import { FamilyType } from '@/types'

import { ActivityItem } from './item'

export const ActivityFeed = async () => {
  const t_common = await getTranslations('common')

  const families = (await getFamilies())?.families

  return (
    <div className="mt-5">
      <TypographyH5>{t_common('recent-activity')}</TypographyH5>
      <p className="mb-5">{t_common('recent-activity-description')} </p>
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
