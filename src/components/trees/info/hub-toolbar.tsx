import Link from 'next/link'
import {
  TreePine,
  CalendarDays,
  Logs,
  NotebookPen,
  Settings2,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { GoBack } from '@/components/layout'

import { cn } from '@/utils'

import { TreeAccessRole } from '@/types'

interface HubToolbarProps {
  slug: string
  role: TreeAccessRole
}

interface HubActionCardProps {
  href: string
  icon: LucideIcon
  label: string
  description: string
}

function HubActionCard({ href, icon: Icon, label, description }: HubActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'bg-ocean-200 hover:bg-ocean-300 shadow-center-sm group text-neutral-50',
        'flex flex-col items-start gap-1 rounded-xl p-3 transition-all'
      )}
    >
      <div className="flex w-full items-center justify-between">
        <Icon size={22} className="text-neutral-50" />
        <ArrowUpRight
          size={14}
          className="text-neutral-50 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
        />
      </div>
      <div className="text-sm font-bold">{label}</div>
      <div className="text-xs opacity-80">{description}</div>
    </Link>
  )
}

export async function TreeInfoHubToolbar({ slug, role }: HubToolbarProps) {
  const t = await getTranslations('tree-info')

  const canEdit = role !== 'VIEWER'

  return (
    <div>
      <GoBack variant="filled" to="/" className="w-auto" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <HubActionCard
          href={`/trees/view/${slug}`}
          icon={TreePine}
          label={t('action-view-tree')}
          description={t('action-view-tree-description')}
        />
        <HubActionCard
          href={`/trees/timeline/${slug}`}
          icon={CalendarDays}
          label={t('action-timeline')}
          description={t('action-timeline-description')}
        />
        <HubActionCard
          href={`/trees/notes/${slug}`}
          icon={NotebookPen}
          label={t('action-notes')}
          description={t('action-notes-description')}
        />
        {canEdit && (
          <>
            <HubActionCard
              href={`/trees/logs/${slug}`}
              icon={Logs}
              label={t('action-logs')}
              description={t('action-logs-description')}
            />
            <HubActionCard
              href={`/trees/edit/${slug}`}
              icon={Settings2}
              label={t('action-settings')}
              description={t('action-settings-description')}
            />
          </>
        )}
      </div>
    </div>
  )
}
