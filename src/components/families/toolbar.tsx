'use client'

import { useTranslations } from 'next-intl'

import { Settings } from '@/components/layout'
import { TypographyH4 } from '@/ui'

export const Toolbar = () => {
  const t_common = useTranslations('common')

  return (
    <div className="mt-5 flex w-full items-center justify-between">
      <TypographyH4>{t_common('families')}</TypographyH4>
      <Settings />
    </div>
  )
}
