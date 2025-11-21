'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion, Variants } from 'framer-motion'

import { FamilySchema } from '@/server/schemas'

import { cn } from '@/utils'

import { Icon } from '../icon'
import { ChevronRight } from 'lucide-react'

export function ItemFamily({ family, index }: { family: FamilySchema | null; index: number }) {
  const t_family = useTranslations('family')

  const motions: Variants = {
    offscreen: { opacity: 0, x: 75 },
    onscreen: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 0.8, delay: index * 0.15 },
    },
  }

  const className = cn(
    'group transition-all duration-300',
    'rounded-lg px-3 py-2 sm:px-5 sm:py-3',
    'flex h-full w-full flex-col items-center justify-center',
    'border-4 shadow-md',
    'hover:bg-pale-ocean border-ocean-100 bg-ocean-100'
  )

  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      variants={motions}
      viewport={{ once: true, amount: 0.01 }}
      className={cn('aspect-square h-32 w-32 p-2', family && 'w-56')}
    >
      {family ? (
        <Link href={`/families/${family.slug}`} className="block h-full w-full">
          <div className={className}>
            <div className="flex flex-col items-center justify-center text-center">
              <Icon
                type={family.type}
                size={24}
                className="stroke-pale-ocean group-hover:stroke-ocean-300 transition-colors duration-300"
              />
              <span className="text-pale-ocean group-hover:text-ocean-300 mt-1 text-base font-extrabold transition-colors duration-300 md:text-lg">
                {family.name}
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/families/new">
          <div
            className={cn(
              className,
              'hover:text-pale-ocean text-ocean-300 flex cursor-pointer flex-row items-center justify-center border-4',
              'bg-pale-ocean hover:bg-ocean-100'
            )}
          >
            <span className="text-center text-base font-bold transition-colors duration-300 md:text-lg">
              {t_family('family-new')}
            </span>
          </div>
        </Link>
      )}
    </motion.div>
  )
}
