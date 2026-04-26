import { GitBranch } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { TreeInfo } from '@/types'

import { Section } from './section'
import { MemberCard } from './member-card'

interface GenerationsProps {
  info: TreeInfo
}

export async function TreeInfoGenerations({ info }: GenerationsProps) {
  const t = await getTranslations('tree-info')
  const { depth, spanYears, oldestMember, youngestMember } = info.generations

  if (depth === 0 && !oldestMember) {
    return (
      <Section title={t('generations-title')} icon={GitBranch}>
        <p className="text-sm italic opacity-70">{t('empty-no-generations')}</p>
      </Section>
    )
  }

  return (
    <Section title={t('generations-title')} icon={GitBranch}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold">{t('generations-depth', { count: depth })}</span>
        {spanYears !== null && spanYears > 0 && (
          <span className="opacity-80">{t('generations-span', { years: spanYears })}</span>
        )}
      </div>
      {(oldestMember || youngestMember) && (
        <div className="flex flex-wrap gap-4">
          {oldestMember && (
            <div>
              <p className="mb-2 text-xs font-medium opacity-70">{t('generations-oldest')}</p>
              <MemberCard
                picture={oldestMember.picture}
                name={oldestMember.name}
                primary={
                  oldestMember.birthDate
                    ? t('generations-born', {
                        gender: oldestMember.gender ?? 'UNSPECIFIED',
                        year: oldestMember.birthDate.getFullYear(),
                      })
                    : undefined
                }
              />
            </div>
          )}
          {youngestMember && (
            <div>
              <p className="mb-2 text-xs font-medium opacity-70">{t('generations-youngest')}</p>
              <MemberCard
                picture={youngestMember.picture}
                name={youngestMember.name}
                primary={
                  youngestMember.birthDate
                    ? t('generations-born', {
                        gender: youngestMember.gender ?? 'UNSPECIFIED',
                        year: youngestMember.birthDate.getFullYear(),
                      })
                    : undefined
                }
              />
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
