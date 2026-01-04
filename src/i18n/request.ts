import { headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import Negotiator from 'negotiator'

import { auth } from '@/auth'

import { getUserById } from '@/server/utils'

import { languageToLocale } from '@/utils/language'

export default getRequestConfig(async () => {
  const defaultHeaders = await headers()
  const headersObj = Object.fromEntries(defaultHeaders.entries())

  const host = headersObj['host'] || 'roots.rguixaro.dev'
  const FORCE_CA_DOMAIN = 'arrels.rguixaro.dev'

  const locales = ['ca', 'en', 'es']
  const defaultLocale = 'ca'

  let locale: string

  const session = await auth()
  if (session?.user?.id) {
    const user = await getUserById(session.user.id)
    if (user?.language) {
      locale = languageToLocale(user.language)
    } else if (host === FORCE_CA_DOMAIN) {
      locale = 'ca'
    } else {
      const negotiator = new Negotiator({ headers: headersObj })
      locale = negotiator.language(locales) || defaultLocale
    }
  } else if (host === FORCE_CA_DOMAIN) {
    locale = 'ca'
  } else {
    const negotiator = new Negotiator({ headers: headersObj })
    locale = negotiator.language(locales) || defaultLocale
  }

  const messages = (await import(`../../messages/${locale}.json`)).default

  return { locale, messages }
})
