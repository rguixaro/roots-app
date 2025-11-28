import Link from 'next/link'
import { Calendar, Cake } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { getMilestones } from '@/server/actions'

import { TypographyH5 } from '@/ui'

export async function Milestones() {
  const milestones = await getMilestones()
  const t_insights = await getTranslations('insights')

  const hasContent = milestones.birthdays.length > 0 || milestones.anniversaries.length > 0

  if (!hasContent)
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
      <div className="text-pale-ocean border-ocean-100 bg-ocean-100 shadow-center flex h-full w-full flex-col rounded-lg border-4">
        {milestones.anniversaries.length > 0 && (
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
                    <Link href={`/trees/${item.treeSlug}`} className="hover:underline">
                      {item.treeName}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mx-auto w-5/6 items-center justify-center">
          <div className="bg-pale-ocean h-0.5 rounded opacity-70 shadow-lg" />
        </div>
        {milestones.birthdays.length > 0 && (
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
                    <Link href={`/trees/${item.treeSlug}`} className="hover:underline">
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
