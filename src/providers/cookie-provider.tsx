'use client'

import { useSession } from 'next-auth/react'

import { useCookies } from '@/hooks'

/**
 * Client component that manages cookies for authenticated users
 */
export function CookiesProvider() {
  const { status } = useSession()

  useCookies(status === 'authenticated')

  return null
}
