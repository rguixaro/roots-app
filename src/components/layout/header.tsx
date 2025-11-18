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
    <div className="flex justify-center">
      <div className="w-10/12 sm:w-2/4 lg:w-3/4">
        <Link
          href="/"
          className="bg-pale-ocean border-ocean-300 sticky top-0 z-50 flex h-24 cursor-pointer items-center justify-center border-b-4"
        >
          <div className="w-full text-center">
            <TypographyH1 className="font-title text-ocean-300 pb-5">
              {displayName ? (
                <span className="text-ocean-200 text-4xl">{`${displayName}'s `}</span>
              ) : null}
              {'Roots'}
            </TypographyH1>
          </div>
        </Link>
      </div>
    </div>
  )
}
