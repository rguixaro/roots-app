'use client'

import { useTranslations } from 'next-intl'

import { NotFoundClient } from '@/components/layout'

export default function NotFound() {
  const t_common = useTranslations('common')

  return (
    <NotFoundClient pageNotFound={t_common('page-not-found')} returnText={t_common('return')} />
  )
}
