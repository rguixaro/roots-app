import { getTranslations } from 'next-intl/server'

import { getTrees } from '@/server/queries'

import { TypographyH5 } from '@/ui'

import { TreeType } from '@/types'

import { ActivityItem } from './item'

export const ActivityFeed = async () => {
  const t_common = await getTranslations('common')

  const trees = (await getTrees())?.trees

  return (
    <div className="mt-5">
      <TypographyH5>{t_common('recent-activity')}</TypographyH5>
      <p className="mb-5">{t_common('recent-activity-description')} </p>
      {[TreeType[0], TreeType[1], TreeType[0], TreeType[1]]?.map((item, i) => {
        return (
          <div key={i}>
            <ActivityItem item={item} index={i} />
          </div>
        )
      })}
    </div>
  )
}
