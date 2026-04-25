import { getTranslations } from 'next-intl/server'

import { TypographyH4 } from '@/ui'

interface Author {
  id: string
  name: string
  image: string | null
}

interface TreeNotesHeaderProps {
  updatedAt: Date | null
  updatedBy: Author | null
}

function formatRelativeTime(
  date: Date,
  t: (key: string, values?: Record<string, number>) => string
): string {
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

export async function TreeNotesHeader({ updatedAt, updatedBy }: TreeNotesHeaderProps) {
  const t_notes = await getTranslations('notes')
  const t_insights = await getTranslations('insights')

  const relative = updatedAt ? formatRelativeTime(new Date(updatedAt), t_insights) : null

  return (
    <div className="mb-4">
      <TypographyH4>{t_notes('title')}</TypographyH4>
      <p className="text-ocean-300">{t_notes('description')}</p>

      {updatedAt && updatedBy ? (
        <p className="text-ocean-300 mt-3 text-xs">
          {t_notes('last-updated-by', { name: updatedBy.name })} · {relative}
        </p>
      ) : (
        <p className="text-ocean-300 mt-3 text-xs italic">{t_notes('never-edited')}</p>
      )}
    </div>
  )
}
