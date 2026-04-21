import type { Breadcrumb } from '@sentry/nextjs'

const JOIN_PATH = /\/trees\/join\/[^/?#]+/
const AUTH_CALLBACK_TOKEN = /(callbackUrl=[^&]*%2Ftrees%2Fjoin%2F)[^&]+/gi

function scrubUrl(value: string): string {
  return value
    .replace(JOIN_PATH, '/trees/join/[redacted]')
    .replace(AUTH_CALLBACK_TOKEN, '$1[redacted]')
}

export function scrubShareTokenFromBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (!breadcrumb?.data) return breadcrumb

  const data = { ...breadcrumb.data }

  if (typeof data.url === 'string') data.url = scrubUrl(data.url)
  if (typeof data.to === 'string') data.to = scrubUrl(data.to)
  if (typeof data.from === 'string') data.from = scrubUrl(data.from)

  return { ...breadcrumb, data }
}
