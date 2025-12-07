import { getTranslations } from 'next-intl/server'

import { LoginClient } from '@/components/auth'

export default async function LoginPage() {
  const t_login = await getTranslations('login')

  return (
    <LoginClient
      loginTo={t_login('login-to')}
      loginName={t_login('login-name')}
      loginText={t_login('login-text')}
      buildYourTreeTitle={t_login('build-your-tree-title')}
      buildYourTreeDescription={t_login('build-your-tree-description')}
      shareMemoriesTitle={t_login('share-memories-title')}
      shareMemoriesDescription={t_login('share-memories-description')}
      privateAndSecureTitle={t_login('private-and-secure-title')}
      privateAndSecureDescription={t_login('private-and-secure-description')}
    />
  )
}
