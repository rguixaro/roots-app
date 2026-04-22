import { MapPin } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { TreeInfo } from '@/types'

import { Section } from './section'

interface PlacesProps {
  info: TreeInfo
}

function PlaceList({
  items,
  emptyLabel,
}: {
  items: Array<{ place: string; count: number }>
  emptyLabel: string
}) {
  if (items.length === 0) {
    return <p className="text-xs italic opacity-70">{emptyLabel}</p>
  }
  return (
    <ul className="space-y-1">
      {items.map((p) => (
        <li key={p.place} className="flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate">{p.place}</span>
          <span className="text-xs font-medium opacity-70">{p.count}</span>
        </li>
      ))}
    </ul>
  )
}

export async function TreeInfoPlaces({ info }: PlacesProps) {
  const t = await getTranslations('tree-info')
  const p = info.places

  if (p.topBirthPlaces.length === 0 && p.topDeathPlaces.length === 0) {
    return (
      <Section title={t('places-title')} icon={MapPin}>
        <p className="text-sm italic opacity-70">{t('empty-no-places')}</p>
      </Section>
    )
  }

  return (
    <Section title={t('places-title')} icon={MapPin}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium opacity-70">
            {t('places-birth-top')}{' '}
            <span className="opacity-70">
              ({t('places-unique', { count: p.uniqueBirthPlaces })})
            </span>
          </p>
          <PlaceList items={p.topBirthPlaces} emptyLabel={t('places-empty')} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium opacity-70">
            {t('places-death-top')}{' '}
            <span className="opacity-70">
              ({t('places-unique', { count: p.uniqueDeathPlaces })})
            </span>
          </p>
          <PlaceList items={p.topDeathPlaces} emptyLabel={t('places-empty')} />
        </div>
      </div>
    </Section>
  )
}
