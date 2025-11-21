'use client'

import { Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/utils'

type SettingsProps = React.HTMLAttributes<HTMLAnchorElement> & {
  className?: string
}

export function Settings({ className }: SettingsProps) {
  return (
    <Link
      href="/profile"
      className={cn(
        'bg-ocean-100 hover:bg-pale-ocean flex items-center justify-center rounded-lg border-2 p-2',
        'group border-ocean-100 transition-colors duration-300',
        className
      )}
    >
      <SettingsIcon
        size={24}
        className="stroke-pale-ocean group-hover:stroke-ocean-300 transition-colors duration-300"
      />
    </Link>
  )
}
