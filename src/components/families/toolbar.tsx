'use client'

import { useTranslations } from 'next-intl'

import { ProfileLink } from '@/components/layout'
import { TypographyH4 } from '@/ui'

export const Toolbar = ({ withAvatar = true }: { withAvatar?: boolean }) => {
  const t_common = useTranslations('common')

  return (
    <div className="my-2 flex w-full items-center justify-between">
      <TypographyH4>{t_common('families')}</TypographyH4>
      {withAvatar && (
        <div className="flex flex-row">
          <ProfileLink />
        </div>
      )}
    </div>
  )
}
