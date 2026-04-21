import Link from 'next/link'
import { Calendar, Cake, Camera } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { getMilestones } from '@/server/actions'

import { TypographyH5, Picture } from '@/ui'

import { getLocalizedDay, getLocalizedMonth } from '@/utils'

import { Expandable } from './expandable'

const MILESTONES_VISIBLE_LIMIT = 5

export async function Milestones() {
  const t_insights = await getTranslations('insights')

  const { anniversaries, birthdays, memories } = await getMilestones()

  const hasBirthdays = birthdays.length > 0
  const hasAnniversaries = anniversaries.length > 0
  const hasMemories = memories.length > 0

  if (!hasBirthdays && !hasAnniversaries)
    return (
      <div>
        <TypographyH5>{t_insights('milestones')}</TypographyH5>
        <p className="mt-2 mb-4">{t_insights('milestones-empty')}</p>
      </div>
    )

  const locale = await getLocale()

  return (
    <div>
      <TypographyH5>{t_insights('milestones')}</TypographyH5>
      <p className="mt-2 mb-4">{t_insights('milestones-description')} </p>
      <div className="text-ocean-400 bg-pale-ocean shadow-center-sm flex h-full w-full flex-col rounded-lg">
        {hasAnniversaries && (
          <div className="p-4">
            <span className="flex items-center gap-2 font-bold">
              <Calendar size={20} />
              {t_insights('on-the-next-thirty-days')}
            </span>
            <Expandable limit={MILESTONES_VISIBLE_LIMIT} className="mt-2 space-y-3">
              {anniversaries.map((item, i) => (
                <div key={i} className="flex items-center space-x-3 p-2">
                  <Picture
                    fileKey={item.picture}
                    classNameContainer="h-16 w-16 shadow-center-sm flex-shrink-0"
                  />
                  <div key={i} className="flex-col items-center justify-between rounded">
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
                        className="decoration-dotted underline-offset-4 hover:underline"
                      >
                        {item.treeName}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Expandable>
          </div>
        )}
        {hasAnniversaries && hasBirthdays && (
          <div className="mx-auto w-5/6 items-center justify-center">
            <div className="bg-ocean-50 shadow-center-sm h-0.5 rounded opacity-70" />
          </div>
        )}
        {hasBirthdays && (
          <div className="p-4">
            <span className="flex items-center gap-2 font-bold">
              <Cake size={20} />
              {t_insights('birthdays-this-month')}
            </span>
            <Expandable limit={MILESTONES_VISIBLE_LIMIT} className="mt-2 space-y-3">
              {birthdays.map((item, i) => (
                <div key={i} className="flex items-center space-x-2 p-2">
                  <Picture
                    fileKey={item.picture}
                    classNameContainer="h-16 w-16 shadow-center-sm flex-shrink-0"
                  />
                  <div key={i} className="flex-col items-center justify-between rounded">
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
                        className="decoration-dotted underline-offset-4 hover:underline"
                      >
                        {item.treeName}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Expandable>
          </div>
        )}
        {(hasBirthdays || hasAnniversaries) && hasMemories && (
          <div className="mx-auto w-5/6 items-center justify-center">
            <div className="bg-ocean-50 shadow-center-sm h-0.5 rounded opacity-70" />
          </div>
        )}
        {hasMemories && (
          <div className="p-4">
            <span className="flex items-center gap-2 font-bold">
              <Camera size={20} />
              {t_insights('memories-on-this-week')}
            </span>
            <Expandable limit={MILESTONES_VISIBLE_LIMIT} className="mt-2 space-y-3">
              {memories.map((item, i) => (
                <div key={i} className="flex items-center space-x-2 p-2">
                  <Picture
                    fileKey={item.picture}
                    classNameContainer="h-16 w-16 shadow-center-sm flex-shrink-0"
                  />
                  <div key={i} className="flex-col items-center justify-between rounded">
                    <p className="text-sm font-medium">
                      {t_insights('memory-description', { yearsAgo: item.yearsAgo ?? 0 })}
                    </p>
                    <p className="text-xs font-medium">
                      {item.name.split(', ').map((name, i) => (
                        <span key={i}>
                          {name}
                          {i < item.name.split(', ').length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                    <div className="flex gap-2 text-xs font-medium opacity-70">
                      <span>{item.date}</span>
                      {' · '}
                      <Link
                        href={`/trees/${item.treeSlug}`}
                        className="decoration-dotted underline-offset-4 hover:underline"
                      >
                        {item.treeName}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Expandable>
          </div>
        )}
      </div>
    </div>
  )
}
