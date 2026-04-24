import Link from 'next/link'
import { Cake, Calendar, Camera } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { getMilestones } from '@/server/actions'

import { MemberCard } from '../info/member-card'
import { Section } from '../info/section'

import type { Milestone } from '@/types'

/**
 * Cross-tree "what's coming up" section on the dashboard. Mirrors the tree
 * hub's upcoming-events layout: three horizontal scrollable strips (birthdays,
 * anniversaries, memories-this-week) built from `<MemberCard>`s.
 * Each card deep-links to its source tree's hub.
 */
export async function Milestones() {
  const t_insights = await getTranslations('insights')
  const locale = await getLocale()

  const { anniversaries, birthdays, memories } = await getMilestones()

  const hasAny = anniversaries.length > 0 || birthdays.length > 0 || memories.length > 0

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { month: 'long', day: 'numeric' })

  return (
    <Section title={t_insights('milestones')} description={t_insights('milestones-description')}>
      {!hasAny && <p className="text-sm italic opacity-70">{t_insights('milestones-empty')}</p>}

      <div className="space-y-6">
        {birthdays.length > 0 && (
          <MilestoneStrip icon={<Cake size={14} />} heading={t_insights('birthdays-this-month')}>
            {birthdays.map((b) => (
              <MilestoneCard
                key={`b-${b.id}`}
                item={b}
                primary={t_insights('birthday-description', {
                  name: b.name,
                  age: b.age ?? 0,
                  daysUntil: b.daysUntil ?? 0,
                })}
                secondary={`${b.date ? formatDate(b.date) : ''} · ${b.treeName}`}
              />
            ))}
          </MilestoneStrip>
        )}

        {anniversaries.length > 0 && (
          <MilestoneStrip
            icon={<Calendar size={14} />}
            heading={t_insights('on-the-next-thirty-days')}
          >
            {anniversaries.map((a) => (
              <MilestoneCard
                key={`a-${a.id}-${a.type}`}
                item={a}
                primary={t_insights('anniversary-description', {
                  name: a.name,
                  yearsAgo: a.yearsAgo ?? 0,
                  type: a.type ?? 'birth',
                })}
                secondary={`${a.date ? formatDate(a.date) : ''} · ${a.treeName}`}
              />
            ))}
          </MilestoneStrip>
        )}

        {memories.length > 0 && (
          <MilestoneStrip icon={<Camera size={14} />} heading={t_insights('memories-on-this-week')}>
            {memories.map((m) => (
              <MilestoneCard
                key={`m-${m.id}`}
                item={m}
                primary={t_insights('memory-description', {
                  yearsAgo: m.yearsAgo ?? 0,
                })}
                secondary={`${m.date ? formatDate(m.date) : ''} · ${m.treeName}`}
              />
            ))}
          </MilestoneStrip>
        )}
      </div>
    </Section>
  )
}

function MilestoneStrip({
  icon,
  heading,
  children,
}: {
  icon: React.ReactNode
  heading: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold opacity-80">
        {icon}
        {heading}
      </p>
      <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 py-2">{children}</div>
    </div>
  )
}

function MilestoneCard({
  item,
  primary,
  secondary,
}: {
  item: Milestone
  primary: string
  secondary: string
}) {
  return (
    <Link href={`/trees/${item.treeSlug}`} className="shrink-0">
      <MemberCard picture={item.picture} name={item.name} primary={primary} secondary={secondary} />
    </Link>
  )
}
