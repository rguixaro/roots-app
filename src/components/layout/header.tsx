'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { TypographyH1 } from '@/ui'

export const Header = ({ username }: { username: string }) => {
  const pathname = usePathname()

  const hideHeader =
    pathname?.match(/^\/families\/[^\/]+$/) &&
    !pathname.includes('/edit/') &&
    !pathname.includes('/new')

  if (hideHeader) return null

  let displayName = ''
  if (username) {
    displayName = username.split(' ')[0]
    if (displayName.length > 12) displayName = displayName.slice(0, 12) + '…'
  }

  return (
    <div className="bg-ocean-100 w-full">
      <Link
        href="/"
        className="bg-ocean-100 border-ocean-200/50 sticky top-0 z-50 flex h-24 cursor-pointer items-center justify-center border-b-8 shadow-lg"
      >
        <div className="w-full text-center">
          <TypographyH1 className="font-title text-pale-ocean pb-5 font-bold">
            {displayName ? (
              <span className="text-3xl font-bold tracking-wide">{`${displayName}'s `}</span>
            ) : null}
            {'Roots'}
          </TypographyH1>
        </div>
      </Link>
    </div>
  )
}
