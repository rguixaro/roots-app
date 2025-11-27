import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { TypographyH4 } from '@/ui'

export default function Loading() {
  const t_logs = useTranslations('log_activities')

  return (
    <div className="text-ocean-400 mt-32 flex flex-col items-center justify-center">
      <Loader size={32} className="mb-4 animate-spin" />
      <TypographyH4>{t_logs('loading')}</TypographyH4>
    </div>
  )
}
