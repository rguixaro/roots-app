'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/ui'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t_common = useTranslations('common')

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <AlertTriangle className="text-ocean-300 h-12 w-12" />
      <h2 className="text-ocean-400 text-xl font-semibold">{t_common('error-title')}</h2>
      <p className="text-ocean-300 text-sm">{t_common('error-description')}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          {t_common('try-again')}
        </Button>
        <Button asChild>
          <Link href="/">{t_common('return')}</Link>
        </Button>
      </div>
    </div>
  )
}
