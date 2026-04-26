import { ReactNode } from 'react'

import { Picture } from '@/ui'

interface MemberRowProps {
  picture?: string | null
  name: string
  primaryText?: ReactNode
  secondaryText?: ReactNode
  trailing?: ReactNode
}

export function MemberRow({ picture, name, primaryText, secondaryText, trailing }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 p-2">
      <Picture fileKey={picture} classNameContainer="h-16 w-16 shadow-center-sm flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {primaryText && <p className="truncate text-xs font-medium opacity-80">{primaryText}</p>}
        {secondaryText && (
          <p className="truncate text-xs font-medium opacity-60">{secondaryText}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}
