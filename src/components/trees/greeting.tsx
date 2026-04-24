'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

interface GreetingProps {
  username: string
}

/**
 * Time-of-day greeting with today's date, localized.
 * Mounts on the client so the hour matches the user's local timezone —
 * SSR renders a minimal placeholder to avoid layout shift.
 */
export function Greeting({ username }: GreetingProps) {
  const t = useTranslations('home')
  const locale = useLocale()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    // Refresh every minute so the greeting rolls over at noon/evening
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!now) {
    return <div className="h-14" aria-hidden />
  }

  const firstName = username.split(' ')[0]
  const hour = now.getHours()
  const key =
    hour < 12 ? 'good-morning' : hour < 19 ? 'good-afternoon' : 'good-evening'

  const formattedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)

  return (
    <div>
      <h1 className="text-ocean-400 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t(key, { name: firstName })}
      </h1>
      <p className="text-ocean-300 mt-1 text-sm capitalize">{formattedDate}</p>
    </div>
  )
}
