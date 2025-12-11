import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { SessionProvider } from 'next-auth/react'
import 'reactflow/dist/style.css'

import { auth } from '@/auth'

import { ToasterProvider } from '@/providers'

import { Header, Footer } from '@/components/layout'

import '@/styles/globals.css'

import { cn } from '@/utils'

const outfit = localFont({
  src: '../fonts/outfit-variable.ttf',
  variable: '--font-outfit',
  weight: '100 900',
})

export async function generateMetadata(): Promise<Metadata> {
  const t_common = await getTranslations('common')
  return { title: t_common('app-name'), description: t_common('app-description') }
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
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.png" />
      </head>
      <body
        className={cn(
          `font-sans ${outfit.variable} antialiased`,
          'bg-ocean-50 selection:bg-ocean-200/15 flex justify-center overflow-x-hidden'
        )}
      >
        <div className="flex min-h-screen w-full flex-col">
          <SessionProvider>
            <NextIntlClientProvider messages={messages}>
              <Header username={userName || ''} />
              <main className="flex-1">{children}</main>
              <Footer />
              <ToasterProvider />
            </NextIntlClientProvider>
          </SessionProvider>
        </div>
      </body>
    </html>
  )
}
