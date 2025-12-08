import Link from 'next/link'
import { Calendar, Cake } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getMilestones } from '@/server/actions'

import { TypographyH5 } from '@/ui'

export async function Milestones() {
  const milestones = await getMilestones()
  const t_insights = await getTranslations('insights')

  const hasBirthdays = milestones.birthdays.length > 0
  const hasAnniversaries = milestones.anniversaries.length > 0

  if (!hasBirthdays && !hasAnniversaries)
    return (
      <div>
        <TypographyH5>{t_insights('milestones')}</TypographyH5>
        <p className="mt-2 mb-4">{t_insights('milestones-empty')}</p>
      </div>
    )

  return (
    <div>
      <TypographyH5>{t_insights('milestones')}</TypographyH5>
      <p className="mt-2 mb-4">{t_insights('milestones-description')} </p>
      <div className="text-ocean-400 bg-pale-ocean shadow-center-sm flex h-full w-full flex-col rounded-lg">
        {hasAnniversaries && (
          <div className="p-4">
            <span className="flex items-center gap-2 font-bold">
              <Calendar size={20} />
              {t_insights('on-this-day')}
            </span>
            <div className="mt-2 space-y-3">
              {milestones.anniversaries.map((item, idx) => (
                <div key={idx} className="flex-col items-center justify-between rounded p-2">
                  <p className="text-sm font-medium">
                    {t_insights('anniversary-description', {
                      name: item.name,
                      yearsAgo: item.yearsAgo ?? 0,
                      type: item.type ?? 'birth',
                    })}
                  </p>
                  <div className="flex gap-2 text-xs font-medium opacity-70">
                    <span>{item.date}</span>
                    {' · '}
                    <Link
                      href={`/trees/${item.treeSlug}`}
                      className="hover:text-ocean-500 decoration-dotted underline-offset-4 hover:underline"
                    >
                      {item.treeName}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {hasAnniversaries && hasBirthdays && (
          <div className="mx-auto w-5/6 items-center justify-center">
            <div className="bg-pale-ocean shadow-center-sm h-0.5 rounded opacity-70" />
          </div>
        )}
        {hasBirthdays && (
          <div className="p-4">
            <span className="flex items-center gap-2 font-bold">
              <Cake size={20} />
              {t_insights('birthdays-this-month')}
            </span>
            <div className="mt-2 space-y-3">
              {milestones.birthdays.map((item, idx) => (
                <div key={idx} className="flex-col items-center justify-between rounded p-2">
                  <p className="text-sm font-medium">
                    {t_insights('birthday-description', {
                      name: item.name,
                      daysUntil: item.daysUntil ?? 0,
                      age: item.age ?? 0,
                    })}
                  </p>
                  <div className="flex gap-2 text-xs font-medium opacity-70">
                    <span>{item.date}</span>
                    {' · '}
                    <Link
                      href={`/trees/${item.treeSlug}`}
                      className="hover:text-ocean-500 decoration-dotted underline-offset-4 hover:underline"
                    >
                      {item.treeName}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
