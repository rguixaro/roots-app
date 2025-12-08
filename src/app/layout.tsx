import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { SessionProvider } from 'next-auth/react'
import 'reactflow/dist/style.css'

import { auth } from '@/auth'

import { ToasterProvider } from '@/providers'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout'

import '@/styles/globals.css'

import { cn } from '@/utils'

const outfit = localFont({
  src: '../fonts/outfit-variable.ttf',
  variable: '--font-outfit',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Roots',
  description: 'Roots application',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  const session = await auth()
  const userName = session?.user.name

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          `font-sans ${outfit.variable} antialiased`,
          'bg-ocean-50 selection:bg-ocean-200/15 flex justify-center overflow-x-hidden'
        )}
      >
        <div className="h-screen w-full">
          <SessionProvider>
            <NextIntlClientProvider messages={messages}>
              <Header username={userName || ''} />
              {children}
              <Footer />
              <ToasterProvider />
            </NextIntlClientProvider>
          </SessionProvider>
        </div>
      </body>
    </html>
  )
}
