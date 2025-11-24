'use client'

import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { SquareArrowOutUpRight } from 'lucide-react'

import { TreeType } from '@/types'

import { cn } from '@/utils'

import { Icon } from '../icon'

export function ActivityItem({ item, index }: { item: TreeType; index: number }) {
  const motions: Variants = {
    offscreen: { opacity: 0, y: 75 },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 0.8, delay: index * 0.15 },
    },
  }
  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      variants={motions}
      viewport={{ once: true, amount: 0.01 }}
      className=""
    >
      <div
        className={cn(
          'group transition-all duration-300',
          'my-4 rounded-lg border-4 px-3 py-2 sm:px-5 sm:py-3',
          'flex flex-col items-start justify-start space-y-2',
          'sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-5',
          'border-ocean-100 hover:bg-pale-ocean bg-ocean-100 hover:shadow-md',
          'hover:text-ocean-300 text-pale-ocean'
        )}
      >
        <div className={cn('flex min-w-0 items-center space-x-3')}>
          <div className="bg-pale-ocean rounded p-1 sm:p-2">
            <Icon
              type={item}
              size={24}
              className="stroke-ocean-100 group-hover:stroke-ocean-300 transition-colors duration-300"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-bold">{item}</span>
            <span className="text-sm">{index}</span>
          </div>
        </div>
        <Link href={`/trees/${'guixaro-trancho'}`} className="max-w-full min-w-0 text-xs font-bold">
          <span className="flex-wrap-break inline-flex items-center gap-2 hover:underline">
            Guixaró-Trancho 2ekm12 12
            <SquareArrowOutUpRight size={16} />
          </span>
        </Link>
        <span className="text-xs">{new Date().toISOString().split('T')[0]}</span>
      </div>
    </motion.div>
  )
}
