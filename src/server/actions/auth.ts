'use server'

import { signOut } from '@/auth'

/**
 * Sign out and redirect to auth page
 * @returns Promise<void>
 */
export const handleSignOut = async () => await signOut({ redirectTo: '/auth' })
