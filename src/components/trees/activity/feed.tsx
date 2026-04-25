import { getTranslations } from 'next-intl/server'

import { getTreeActivityLogs } from '@/server/queries'

import { TypographyH4 } from '@/ui'

import { GoBack } from '@/components/layout'

import { ActivityItem } from './item'

export const ActivityFeed = async (slug: string) => {
  const t_trees = await getTranslations('trees')

  const { logs: activityLogs } = (await getTreeActivityLogs(slug)) ?? {}

  return (
    <div className="text-ocean-400 z-0 flex w-full flex-col">
      <GoBack variant="filled" to={`/trees/${slug}`} className="w-auto" />
      <TypographyH4>{t_trees('recent-activity')}</TypographyH4>
      <p className="mb-5">{t_trees('recent-activity-description')} </p>
      {activityLogs?.map((log, i) => (
        <ActivityItem key={i} log={log} index={i} />
      ))}
    </div>
  )
}
