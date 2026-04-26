import { Crown, Baby, TreePine, Camera } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { TreeInfo } from '@/types'

import { Section } from './section'
import { MemberRow } from './member-row'

interface HighlightsProps {
  info: TreeInfo
}

export async function TreeInfoHighlights({ info }: HighlightsProps) {
  const t = await getTranslations('tree-info')
  const h = info.highlights

  const anyHighlight = h.oldestAncestor || h.youngestMember || h.largestBranch || h.mostPhotographed

  if (!anyHighlight) return null

  return (
    <Section title={t('highlights-title')} icon={Crown}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {h.oldestAncestor && (
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium opacity-70">
              <Crown size={14} />
              {t('highlights-oldest')}
            </p>
            <MemberRow
              picture={h.oldestAncestor.picture}
              name={h.oldestAncestor.name}
              primaryText={
                h.oldestAncestor.birthDate
                  ? `${h.oldestAncestor.birthDate.getFullYear()}`
                  : undefined
              }
            />
          </div>
        )}
        {h.youngestMember && (
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium opacity-70">
              <Baby size={14} />
              {t('highlights-youngest')}
            </p>
            <MemberRow
              picture={h.youngestMember.picture}
              name={h.youngestMember.name}
              primaryText={
                h.youngestMember.birthDate
                  ? `${h.youngestMember.birthDate.getFullYear()}`
                  : undefined
              }
            />
          </div>
        )}
        {h.largestBranch && (
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium opacity-70">
              <TreePine size={14} />
              {t('highlights-largest')}
            </p>
            <MemberRow
              picture={h.largestBranch.picture}
              name={h.largestBranch.name}
              primaryText={t('relationships-children-count', {
                count: h.largestBranch.childrenCount,
              })}
            />
          </div>
        )}
        {h.mostPhotographed && (
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium opacity-70">
              <Camera size={14} />
              {t('highlights-most-photos')}
            </p>
            <MemberRow
              picture={h.mostPhotographed.picture}
              name={h.mostPhotographed.name}
              primaryText={t('pictures-count', {
                count: h.mostPhotographed.photoCount,
              })}
            />
          </div>
        )}
      </div>
    </Section>
  )
}
