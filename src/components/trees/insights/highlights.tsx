import { getTranslations } from 'next-intl/server'

import { getHighlights } from '@/server/actions'

import { HighlightCard } from '@/types'

import { TypographyH5 } from '@/ui'

import { HighlightItem } from './card'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export async function Highlights() {
  const highlights = await getHighlights()
  const t_insights = await getTranslations('insights')

  const cards: HighlightCard[] = [
    highlights.oldest && {
      title: t_insights('oldest-ancestor-title'),
      value: highlights.oldest.name,
      subtitle: t_insights('oldest-ancestor-subtitle', {
        year: highlights.oldest.birthYear ?? 'N/A',
      }),
      treeName: highlights.oldest.treeName,
      treeSlug: highlights.oldest.treeSlug,
      picture: highlights.oldest.picture,
    },
    highlights.newest &&
      highlights.newest.addedAt && {
        title: t_insights('recently-added-title'),
        value: highlights.newest.name,
        subtitle: t_insights('recently-added-subtitle', {
          relativeTime: formatRelativeTime(highlights.newest.addedAt),
        }),
        treeName: highlights.newest.treeName,
        treeSlug: highlights.newest.treeSlug,
        picture: highlights.newest.picture,
      },
    highlights.largest && {
      title: t_insights('most-children-title'),
      value: highlights.largest.name,
      subtitle: t_insights('most-children-subtitle', {
        count: highlights.largest.childrenCount ?? 0,
      }),
      treeName: highlights.largest.treeName,
      treeSlug: highlights.largest.treeSlug,
      picture: highlights.largest.picture,
    },
    highlights.mostPhotos && {
      title: t_insights('most-pictures-title'),
      value: highlights.mostPhotos.name,
      subtitle: t_insights('most-pictures-subtitle', {
        count: highlights.mostPhotos.photoCount ?? 0,
      }),
      treeName: highlights.mostPhotos.treeName,
      treeSlug: highlights.mostPhotos.treeSlug,
      picture: highlights.mostPhotos.picture,
    },
  ].filter(Boolean) as NonNullable<(typeof cards)[number]>[]

  if (!cards.length)
    return (
      <div>
        <TypographyH5>{t_insights('highlights')}</TypographyH5>
        <p className="mt-2 mb-4">{t_insights('highlights-empty')} </p>
      </div>
    )

  return (
    <div>
      <TypographyH5>{t_insights('highlights')}</TypographyH5>
      <p className="mt-2 mb-4">{t_insights('highlights-description')} </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <HighlightItem key={i} item={card} index={i} total={cards.length} />
        ))}
      </div>
    </div>
  )
}
