import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'

import { GoBack } from '@/components/layout'
import { UpdateAccount } from '@/components/profile'

import { TypographyH4 } from '@/ui'

export default async function ProfilePage() {
  const t_profile = await getTranslations('profile')

  const session = await auth()
  if (!session) return null

  return (
    <div className="animate-in fade-in-5 slide-in-from-bottom-2 text-ocean-400 mt-5 duration-500">
      <GoBack />
      <TypographyH4 className="mt-4">{t_profile('title')}</TypographyH4>
      <p className="mb-4">{t_profile('description')} </p>
      <UpdateAccount
        id={session.user.id!}
        name={session.user.name!}
        email={session.user.email!}
        newsletter={session.user.newsletter!}
        language={session.user.language!}
      />
    </div>
  )
}
