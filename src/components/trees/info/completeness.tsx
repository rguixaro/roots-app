import { CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { TreeInfo } from '@/types'

import { Section } from './section'
import { Bar } from './bar'

interface CompletenessProps {
  info: TreeInfo
}

export async function TreeInfoCompleteness({ info }: CompletenessProps) {
  const t = await getTranslations('tree-info')
  const d = info.demographics
  const total = info.overview.totalMembers

  if (total === 0) return null

  return (
    <Section
      title={t('completeness-title')}
      icon={CheckCircle2}
      description={t('completeness-description')}
    >
      <div className="space-y-4">
        <Bar label={t('completeness-birth-date')} value={d.withBirthDate} total={total} />
        <Bar label={t('completeness-birth-place')} value={d.withBirthPlace} total={total} />
        <Bar
          label={t('completeness-death-date')}
          value={d.withDeathDate}
          total={d.deceasedCount > 0 ? d.deceasedCount : total}
          valueLabel={d.deceasedCount > 0 ? `${d.withDeathDate}/${d.deceasedCount}` : undefined}
        />
        <Bar label={t('completeness-biography')} value={d.withBiography} total={total} />
        <Bar label={t('completeness-picture')} value={d.withProfilePicture} total={total} />
        <Bar label={t('completeness-gender')} value={d.withGender} total={total} />
      </div>
    </Section>
  )
}
