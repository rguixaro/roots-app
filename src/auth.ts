import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Adapter } from 'next-auth/adapters'
import NextAuth from 'next-auth'

import { Language } from '@prisma/client'

import AuthConfig from '@/auth.config'

import { db } from '@/server/db'
import { getUserById, getAccountByUserId } from '@/server/utils'

import { sendWelcomeEmail } from '@/lib/email'

import { languageToLocale } from '@/utils/language'

import { env } from './env.mjs'

const { AUTH_SECRET } = env

/**
 * NextAuth configuration
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,
  session: { strategy: 'jwt' },
  basePath: '/api/auth',
  secret: AUTH_SECRET,
  pages: { signIn: '/auth', error: '/auth/error' },
  events: {
    async createUser({ user }) {
      if (user.email) {
        sendWelcomeEmail({
          recipientEmail: user.email,
          recipientName: user.name || user.email,
          locale: 'en',
        }).catch((_) => {})
      }
    },
  },
  callbacks: {
    async signIn() {
      return true
    },
    async session({ token, session }) {
      if (token.sub && session.user) session.user.id = token.sub

      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email!
        session.user.isOAuth = token.isOAuth as boolean
        session.user.newsletter = token.newsletter as boolean
        session.user.language = token.language as Language
      }

      return session
    },
    async jwt({ token }) {
      if (!token.sub) return token
      const existingUser = await getUserById(token.sub)

      if (!existingUser) return token
      const existingAccount = await getAccountByUserId(existingUser.id)

      token.isOAuth = !!existingAccount
      token.name = existingUser.name
      token.email = existingUser.email
      token.newsletter = existingUser.newsletter
      token.language = existingUser.language

      return token
    },
  },
  ...AuthConfig,
})
