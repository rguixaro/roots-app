import { Calendar, Cake, Camera } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { TreeInfo } from '@/types'

import { Section } from './section'
import { MemberCard } from './member-card'

interface UpcomingEventsProps {
  info: TreeInfo
}

export async function TreeInfoUpcomingEvents({ info }: UpcomingEventsProps) {
  const t = await getTranslations('tree-info')
  const locale = await getLocale()
  const u = info.upcomingEvents

  const hasAny =
    u.birthdays.length > 0 || u.anniversaries.length > 0 || u.memoriesThisWeek.length > 0

  if (!hasAny) {
    return (
      <Section title={t('upcoming-title')} icon={Calendar}>
        <p className="text-sm italic opacity-70">{t('upcoming-empty')}</p>
      </Section>
    )
  }

  const formatDate = (d: Date) => d.toLocaleDateString(locale, { month: 'long', day: 'numeric' })

  return (
    <Section title={t('upcoming-title')} icon={Calendar}>
      <div className="space-y-5">
        {u.birthdays.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold opacity-80">
              <Cake size={14} />
              {t('upcoming-birthdays')}
            </p>
            <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 py-2">
              {u.birthdays.map((b) => (
                <MemberCard
                  key={b.id}
                  picture={b.picture}
                  name={b.name}
                  primary={t('upcoming-birthday-description', {
                    age: b.age,
                    daysUntil: b.daysUntil,
                  })}
                  secondary={formatDate(b.date)}
                />
              ))}
            </div>
          </div>
        )}
        {u.anniversaries.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold opacity-80">
              <Calendar size={14} />
              {t('upcoming-anniversaries')}
            </p>
            <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 py-2">
              {u.anniversaries.map((a) => (
                <MemberCard
                  key={`${a.id}-${a.type}`}
                  picture={a.picture}
                  name={a.name}
                  primary={t(
                    a.type === 'birth'
                      ? 'upcoming-anniversary-birth'
                      : 'upcoming-anniversary-death',
                    { years: a.yearsAgo }
                  )}
                  secondary={formatDate(a.date)}
                />
              ))}
            </div>
          </div>
        )}
        {u.memoriesThisWeek.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold opacity-80">
              <Camera size={14} />
              {t('upcoming-memories')}
            </p>
            <div className="no-scrollbar -mx-2 flex gap-3 overflow-x-auto px-2 py-2">
              {u.memoriesThisWeek.map((m) => (
                <MemberCard
                  key={m.id}
                  picture={m.picture}
                  name={m.name}
                  primary={t('upcoming-memory-description', {
                    yearsAgo: m.yearsAgo,
                  })}
                  secondary={formatDate(m.date)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
