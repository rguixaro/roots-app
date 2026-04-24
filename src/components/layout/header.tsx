'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { AUTH_ROUTES } from '@/routes'

import { isKnownRoute, isTreeDetailRoute, normalizePath } from '@/utils'

interface HeaderProps {
  username: string
  userImage?: string | null
}

export const Header = ({ username, userImage }: HeaderProps) => {
  const t_common = useTranslations('common')
  const t_profile = useTranslations('profile')

  const pathname = usePathname()
  const normalized = normalizePath(pathname)

  const hideHeader =
    AUTH_ROUTES.includes(normalized) || isTreeDetailRoute(normalized) || !isKnownRoute(normalized)

  if (hideHeader) return null

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="border-ocean-100/60 bg-pale-ocean sticky top-0 z-50 w-full border-b backdrop-blur-md"
    >
      <div className="mx-auto flex w-11/12 max-w-6xl items-center justify-between gap-4 py-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" className="min-w-0 shrink">
            <span className="text-ocean-400 block truncate text-lg font-extrabold tracking-tight sm:text-2xl">
              {t_common('app-name').toLowerCase()}
            </span>
          </Link>

          <nav className="flex shrink-0 items-center gap-4 sm:gap-5">
            <NavLink href="/" active={normalized === '/'}>
              {t_common('home')}
            </NavLink>
            <NavLink href="/about" active={normalized === '/about'}>
              {t_common('about')}
            </NavLink>
          </nav>
        </div>

        {username && (
          <Link
            href="/profile"
            aria-label={t_profile('account-tab-label')}
            className="group flex items-center gap-2 transition-colors duration-200"
          >
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={username}
                referrerPolicy="no-referrer"
                className="ring-ocean-100 group-hover:ring-ocean-200 h-8 w-8 shrink-0 rounded-full object-cover ring-2 transition-all duration-200"
              />
            ) : (
              <div className="bg-ocean-100 text-ocean-400 ring-ocean-100 group-hover:ring-ocean-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 transition-all duration-200">
                <User size={16} />
              </div>
            )}
          </Link>
        )}
      </div>
    </motion.header>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`relative text-xs font-semibold transition-colors duration-200 sm:text-base ${
        active ? 'text-ocean-400' : 'text-ocean-300 hover:text-ocean-400'
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="nav-underline"
          className="bg-ocean-400 absolute right-0 -bottom-1.5 left-0 h-0.5 rounded-full"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  )
}
