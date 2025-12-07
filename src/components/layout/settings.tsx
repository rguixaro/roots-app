'use client'

import Link from 'next/link'
import { Settings as SettingsIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/utils'

type SettingsProps = React.HTMLAttributes<HTMLAnchorElement> & {
  className?: string
}

export function Settings({ className }: SettingsProps) {
  return (
    <motion.div
      variants={{
        idle: { scale: 1 },
        hover: { scale: 1.1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
        tap: { scale: 0.95 },
      }}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
    >
      <Link
        href={'/profile'}
        className={cn(
          'bg-ocean-300 block cursor-pointer rounded p-1',
          'group transition-colors duration-300',
          'outline-none focus:outline-none focus-visible:outline-none',
          className
        )}
      >
        <SettingsIcon
          size={24}
          className="text-ocean-50 group-hover:text-pale-ocean transition-colors duration-300"
        />
      </Link>
    </motion.div>
  )
}
