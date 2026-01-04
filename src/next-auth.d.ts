import type { Language, UserRole } from '@prisma/client'

import { type DefaultSession } from 'next-auth'

export type ExtendedUser = DefaultSession['user'] & {
  role: UserRole
  isOAuth: boolean
  newsletter: boolean
  language: Language
}

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: {
      username: string | undefined
    } & DefaultSession['user']
  }
}
