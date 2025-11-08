import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FileQuestion } from 'lucide-react'

import { auth } from '@/auth'
import { getFamily } from '@/server/queries'
import { EditFamily } from '@/components/families/form'
import { TypographyH4 } from '@/ui'

export default async function EditFamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) return null

  const { slug } = await params
  const family = await getFamily(slug)
  const t = await getTranslations('common')

  if (!family) {
    return (
      <div className="text-ocean-200 mt-32 flex flex-col items-center justify-center">
        <FileQuestion size={24} />
        <TypographyH4 className="mt-2 mb-5">{t('family-not-found')}</TypographyH4>
        <Link href="/" className="mt-5 font-medium underline">
          {t('return')}
        </Link>
      </div>
    )
  }

  return <EditFamily userId={session.user.id!} family={family} />
}
