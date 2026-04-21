import { headers } from 'next/headers'

export const DEFAULT_SITE_URL = 'https://roots.rguixaro.dev'
export const CA_SITE_URL = 'https://arrels.rguixaro.dev'

const DEFAULT_SITE_HOST = new URL(DEFAULT_SITE_URL).host
const CA_SITE_HOST = new URL(CA_SITE_URL).host

export async function getRequestSiteUrl(): Promise<string> {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost ?? requestHeaders.get('host') ?? DEFAULT_SITE_HOST
  const forwardedProto = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https')

  if (host === CA_SITE_HOST) return CA_SITE_URL
  if (host === DEFAULT_SITE_HOST) return DEFAULT_SITE_URL

  return `${protocol}://${host}`
}

export function getLanguageAlternates(pathname = ''): Record<string, string> {
  return {
    ca: `${CA_SITE_URL}${pathname}`,
    'x-default': `${DEFAULT_SITE_URL}${pathname}`,
  }
}
