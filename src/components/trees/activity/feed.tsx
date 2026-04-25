import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { getTreeActivityLogs } from '@/server/queries'

import { Button, TypographyH4 } from '@/ui'

import { GoBack } from '@/components/layout'

import { ActivityItem } from './item'

export const ActivityFeed = async (slug: string, page = 1) => {
  const t_trees = await getTranslations('trees')

  const { logs: activityLogs, pagination } = await getTreeActivityLogs(slug, page)
  const hasPreviousPage = pagination.page > 1
  const hasNextPage = pagination.page < pagination.totalPages
  const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total)

  return (
    <div className="text-ocean-400 z-0 flex w-full flex-col">
      <GoBack variant="filled" to={`/trees/${slug}`} className="w-auto" />
      <TypographyH4>{t_trees('recent-activity')}</TypographyH4>
      <p className="mb-5">{t_trees('recent-activity-description')} </p>
      {activityLogs.length === 0 && (
        <p className="text-sm italic opacity-70">{t_trees('activity-empty')}</p>
      )}
      {activityLogs.map((log, i) => (
        <ActivityItem key={log.id} log={log} index={i} />
      ))}
      {pagination.totalPages > 1 && (
        <div className="border-ocean-200/15 mt-6 mb-8 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm opacity-70">
            {t_trees('activity-pagination-summary', {
              start,
              end,
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={!hasPreviousPage ? 'pointer-events-none opacity-50' : ''}
            >
              <Link
                href={`/trees/logs/${slug}?page=${Math.max(1, pagination.page - 1)}`}
                aria-disabled={!hasPreviousPage}
                tabIndex={hasPreviousPage ? undefined : -1}
              >
                <ChevronLeft size={16} />
                <span>{t_trees('activity-previous')}</span>
              </Link>
            </Button>
            <span className="px-2 text-sm font-medium opacity-80">
              {t_trees('activity-page', {
                page: pagination.page,
                totalPages: pagination.totalPages,
              })}
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={!hasNextPage ? 'pointer-events-none opacity-50' : ''}
            >
              <Link
                href={`/trees/logs/${slug}?page=${Math.min(pagination.totalPages, pagination.page + 1)}`}
                aria-disabled={!hasNextPage}
                tabIndex={hasNextPage ? undefined : -1}
              >
                <span>{t_trees('activity-next')}</span>
                <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
