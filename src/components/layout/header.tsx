'use client'

import Link from 'next/link'

import { TypographyH1 } from '@/ui'
import { useProfileContext } from '@/providers'

export const Header = () => {
  const { currentUserName, userName } = useProfileContext()
  const nameToDisplay = userName || currentUserName

  let displayName = ''
  if (nameToDisplay) {
    displayName = nameToDisplay.split(' ')[0]
    if (displayName.length > 12) {
      displayName = displayName.slice(0, 12) + '…'
    }
  }

  return (
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
  )
}
