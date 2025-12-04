'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion, Variants } from 'framer-motion'

import { TreeSchema } from '@/server/schemas'

import { cn } from '@/utils'

import { Icon } from '../icon'
import { Plus } from 'lucide-react'

export function ItemTree({ tree, index }: { tree: TreeSchema | null; index: number }) {
  const t_trees = useTranslations('trees')

  const motions: Variants = {
    hover: { scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    offscreen: { opacity: 0, x: 150, scale: 1 },
    onscreen: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 0.8, delay: index * 0.15 },
    },
  }

  const className = cn(
    'group transition-all duration-300 shadow-center-sm',
    'rounded-lg px-3 py-2 sm:px-5 sm:py-3',
    'flex h-full w-full flex-col items-center justify-center',
    'hover:bg-ocean-200 bg-pale-ocean text-ocean-400 hover:text-pale-ocean'
  )

  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      whileHover="hover"
      variants={motions}
      viewport={{ once: true, amount: 0.01 }}
      className={cn('aspect-square h-32 w-32 p-2', tree && 'w-56')}
    >
      {tree ? (
        <Link href={`/trees/${tree.slug}`} className="block h-full w-full">
          <div className={className}>
            <div className="flex flex-col items-center justify-center text-center">
              <Icon
                type={tree.type}
                size={24}
                className="stroke-ocean-400 group-hover:stroke-pale-ocean transition-colors duration-300"
              />
              <span className="mt-1 text-base leading-5 font-extrabold transition-colors duration-300 md:text-lg">
                {tree.name}
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/trees/new">
          <div
            className={cn(
              className,
              'flex cursor-pointer flex-col items-center justify-center',
              'text-ocean-400 bg-pale-ocean hover:bg-ocean-200 hover:text-pale-ocean'
            )}
          >
            <Plus
              size={24}
              className="stroke-ocean-400 group-hover:stroke-pale-ocean transition-colors duration-300"
            />
            <span className="text-center leading-5 font-medium transition-colors duration-300 md:text-lg">
              {t_trees('tree-new')}
            </span>
          </div>
        </Link>
      )}
    </motion.div>
  )
}
