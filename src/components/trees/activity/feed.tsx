import { getTranslations } from 'next-intl/server'

import { getTreeActivityLogs } from '@/server/queries'

import { TypographyH5 } from '@/ui'

import { GoBack } from '@/components/layout'

import { ActivityItem } from './item'

export const ActivityFeed = async (slug: string) => {
  const t_trees = await getTranslations('trees')

  const { logs: activityLogs } = (await getTreeActivityLogs(slug)) ?? {}

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col pt-2">
      <GoBack variant="filled" to={`/trees/${slug}`} className="w-auto" />
      <TypographyH5>{t_trees('recent-activity')}</TypographyH5>
      <p className="mb-5">{t_trees('recent-activity-description')} </p>
      {activityLogs?.map((log, i) => (
        <ActivityItem key={i} log={log} index={i} />
      ))}
    </div>
  )
}
