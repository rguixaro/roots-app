import { Heart } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { TreeInfo } from '@/types'

import { Section } from './section'
import { Bar } from './bar'
import { MemberCard } from './member-card'

interface LifeStatsProps {
  info: TreeInfo
}

export async function TreeInfoLifeStats({ info }: LifeStatsProps) {
  const t = await getTranslations('tree-info')
  const ls = info.lifeStats

  if (
    ls.topLongestLived.length === 0 &&
    ls.ageAtDeathBuckets.length === 0 &&
    ls.birthDecadeBuckets.length === 0
  ) {
    return (
      <Section title={t('life-title')} icon={Heart}>
        <p className="text-sm italic opacity-70">{t('empty-no-life-stats')}</p>
      </Section>
    )
  }

  const totalAgeAtDeath = ls.ageAtDeathBuckets.reduce((s, b) => s + b.count, 0)
  const totalBirthDecades = ls.birthDecadeBuckets.reduce((s, b) => s + b.count, 0)

  return (
    <Section title={t('life-title')} icon={Heart}>
      {ls.topLongestLived.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium opacity-70">{t('life-longest-lived')}</p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {ls.topLongestLived.map((m) => (
              <MemberCard
                key={m.id}
                picture={m.picture}
                name={m.name}
                primary={t('life-age-years', { age: m.ageAtDeath })}
              />
            ))}
          </div>
        </div>
      )}
      {ls.ageAtDeathBuckets.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium opacity-70">{t('life-age-at-death')}</p>
          <div className="space-y-2">
            {ls.ageAtDeathBuckets.map((b) => (
              <Bar
                key={b.label}
                label={b.label}
                value={b.count}
                total={totalAgeAtDeath}
                valueLabel={String(b.count)}
              />
            ))}
          </div>
        </div>
      )}
      {ls.birthDecadeBuckets.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium opacity-70">{t('life-birth-decades')}</p>
          <div className="space-y-4">
            {ls.birthDecadeBuckets.map((b) => (
              <Bar
                key={b.decade}
                label={b.decade}
                value={b.count}
                total={totalBirthDecades}
                valueLabel={String(b.count)}
              />
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}
