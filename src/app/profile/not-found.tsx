import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { TypographyH4 } from '@/ui'

export default async function NotFound() {
  const t_common = await getTranslations('common')
  const t_errors = await getTranslations('errors')

  return (
    <div className="text-ocean-200 mt-32 flex flex-col items-center justify-center">
      <FileQuestion size={24} />
      <TypographyH4 className="mt-2 mb-5">{t_errors('error-user-not-found')}</TypographyH4>
      <Link href="/" className="mt-5 font-medium underline">
        {t_common('return')}
      </Link>
    </div>
  )
}
