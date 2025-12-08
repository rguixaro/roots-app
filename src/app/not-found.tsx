import { getTranslations } from 'next-intl/server'

import { NotFoundClient } from '@/components/layout'

export default async function NotFound() {
  const t_common = await getTranslations('common')

  return (
    <NotFoundClient pageNotFound={t_common('page-not-found')} returnText={t_common('return')} />
  )
}
