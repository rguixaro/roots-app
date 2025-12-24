'use client'

import Link from 'next/link'
import { motion, Variants } from 'framer-motion'

import { Picture } from '@/ui'

import { HighlightCard } from '@/types'

export function HighlightItem({
  item,
  index,
  total,
}: {
  item: HighlightCard
  index: number
  total: number
}) {
  const motions: Variants = {
    hidden: { opacity: 0, x: -150 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 0.8, delay: (total - 1 - index) * 0.15 },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motions}
      className="text-ocean-400 bg-pale-ocean shadow-center-sm flex max-w-44 flex-col space-y-2 rounded-lg p-4 text-sm"
    >
      <h3 className="font-bold">{item.title}</h3>
      <div className="bg-pale-ocean shadow-center-sm h-0.5 w-3/4 rounded opacity-70" />
      <div className="flex grow flex-col justify-between gap-2">
        <div className="mb-2 flex items-center space-x-2">
          <Picture
            fileKey={item.picture}
            classNameContainer="h-12 w-12 shadow-center-sm border-ocean-400 flex-shrink-0"
          />
          <span className="leading-tight font-medium text-ellipsis">{item.value}</span>
        </div>
        <div className="flex flex-col text-xs font-medium opacity-70">
          <span>{item.subtitle}</span>
          <Link
            href={`/trees/${item.treeSlug}`}
            className="hover:text-ocean-500 decoration-dotted underline-offset-4 hover:underline"
          >
            {item.treeName}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
