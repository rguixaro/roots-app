'use client'

import Link from 'next/link'
import { motion, Variants } from 'framer-motion'

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
    offscreen: { opacity: 0, x: -150 },
    onscreen: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 0.8, delay: (total - 1 - index) * 0.15 },
    },
  }

  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      variants={motions}
      viewport={{ once: true, amount: 0.01 }}
      className="text-ocean-400 bg-pale-ocean shadow-center-sm flex flex-col space-y-2 rounded-lg p-4 text-sm"
    >
      <h3 className="font-bold uppercase">{item.title}</h3>
      <div className="bg-pale-ocean shadow-center-sm h-0.5 w-3/4 rounded opacity-70" />
      <div className="flex grow flex-col justify-between gap-2">
        <p className="mb-2 leading-tight font-medium">{item.value}</p>
        <div className="flex flex-col text-xs font-medium opacity-70">
          <span>{item.subtitle}</span>
          <Link href={`/trees/${item.treeSlug}`} className="hover:text-ocean-500 hover:underline">
            {item.treeName}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
