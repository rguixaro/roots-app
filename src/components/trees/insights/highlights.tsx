import { getTranslations } from 'next-intl/server'

import { getHighlights } from '@/server/actions'

import { HighlightCard } from '@/types'

import { cn } from '@/utils'

import { HighlightItem } from './card'

function formatRelativeTime(
  dateString: string,
  t: (key: string, values?: Record<string, number>) => string
): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return t('relative-today')
  if (diffDays === 1) return t('relative-yesterday')
  if (diffDays < 7) return t('relative-days-ago', { count: diffDays })
  if (diffDays < 30) return t('relative-weeks-ago', { count: Math.floor(diffDays / 7) })
  if (diffDays < 365) return t('relative-months-ago', { count: Math.floor(diffDays / 30) })
  return t('relative-years-ago', { count: Math.floor(diffDays / 365) })
}

export async function Highlights() {
  const { oldest, newest, largest, mostPhotos, mostMembers } = await getHighlights()
  const t_insights = await getTranslations('insights')

  const cards: HighlightCard[] = [
    oldest && {
      title: t_insights('oldest-ancestor-title'),
      value: oldest.name,
      subtitle: t_insights('oldest-ancestor-subtitle', {
        year: oldest.birthYear ?? 'N/A',
      }),
      treeName: oldest.treeName,
      treeSlug: oldest.treeSlug,
      picture: oldest.picture,
    },
    newest &&
      newest.addedAt && {
        title: t_insights('recently-added-title'),
        value: newest.name,
        subtitle: t_insights('recently-added-subtitle', {
          relativeTime: formatRelativeTime(newest.addedAt, t_insights),
        }),
        treeName: newest.treeName,
        treeSlug: newest.treeSlug,
        picture: newest.picture,
      },
    largest && {
      title: t_insights('most-children-title'),
      value: largest.name,
      subtitle: t_insights('most-children-subtitle', {
        count: largest.childrenCount ?? 0,
      }),
      treeName: largest.treeName,
      treeSlug: largest.treeSlug,
      picture: largest.picture,
    },
    mostPhotos && {
      title: t_insights('most-pictures-title'),
      value: mostPhotos.name,
      subtitle: t_insights('most-pictures-subtitle', {
        count: mostPhotos.photoCount ?? 0,
      }),
      treeName: mostPhotos.treeName,
      treeSlug: mostPhotos.treeSlug,
      picture: mostPhotos.picture,
    },
    mostMembers && {
      title: t_insights('most-members-title'),
      value: mostMembers.name,
      subtitle: t_insights('most-members-subtitle', {
        count: mostMembers.memberCount ?? 0,
      }),
      treeName: mostMembers.treeName,
      treeSlug: mostMembers.treeSlug,
      picture: mostMembers.picture,
    },
  ].filter(Boolean) as NonNullable<(typeof cards)[number]>[]

  if (!cards.length)
    return (
      <div className="w-3/4 self-center sm:w-3/4">
        <div className="text-ocean-400 flex h-full items-center justify-center">
          <div className="h-full w-full sm:w-4/5 md:w-3/5">
            <p>{t_insights('highlights-empty')} </p>
          </div>
        </div>
      </div>
    )

  return (
    <div
      className={cn(
        'no-scrollbar mx-auto flex w-full justify-start overflow-x-auto overflow-y-hidden',
        'sm:justify-center',
        cards.length <= 5 ? 'sm:justify-center' : 'sm:justify-start'
      )}
    >
      <div className="flex w-max flex-row gap-4 px-4">
        {cards.map((card, i) => (
          <HighlightItem key={i} item={card} index={i} total={cards.length} />
        ))}
      </div>
    </div>
  )
}
