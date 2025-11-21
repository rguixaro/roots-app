'use client'

import { useTranslations } from 'next-intl'

import { ProfileLink } from '@/components/layout'
import { TypographyH4 } from '@/ui'

export const Toolbar = ({ withAvatar = true }: { withAvatar?: boolean }) => {
  const t_common = useTranslations('common')

  return (
    <div className="mt-5 flex w-full items-center justify-between">
      <TypographyH4>{t_common('families')}</TypographyH4>
      {withAvatar &&  <ProfileLink />}
    </div>
  )
}
