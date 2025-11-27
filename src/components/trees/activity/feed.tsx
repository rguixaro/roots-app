import { getTranslations } from 'next-intl/server'

import { getTreeActivityLogs } from '@/server/queries'

import { TypographyH5 } from '@/ui'

import { ActivityItem } from './item'
import { GoBack } from '@/components/layout'

export const ActivityFeed = async (slug: string) => {
  const t_common = await getTranslations('common')

  const { logs: activityLogs } = (await getTreeActivityLogs(slug)) ?? {}

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col pt-2">
      <GoBack to={`/trees/${slug}`} />
      <TypographyH5>{t_common('recent-activity')}</TypographyH5>
      <p className="mb-5">{t_common('recent-activity-description')} </p>
      {activityLogs?.map((log, i) => (
        <ActivityItem key={i} log={log} index={i} />
      ))}
    </div>
  )
}
