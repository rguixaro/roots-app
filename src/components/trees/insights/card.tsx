'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
  const t_insights = useTranslations('insights')

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
      className="text-pale-ocean bg-ocean-100 border-ocean-100 shadow-center flex flex-col space-y-2 rounded-lg border-4 p-4 text-xs"
    >
      <h3 className="font-bold uppercase">{item.title}</h3>
      <div className="bg-pale-ocean h-0.5 w-3/4 rounded opacity-70 shadow-lg" />
      <div className="flex grow flex-col justify-between gap-2">
        <p className="mb-2 text-sm leading-tight font-semibold">{item.value}</p>
        <div className="flex flex-col font-medium opacity-70">
          <span>{item.subtitle}</span>
          <Link href={`/trees/${item.treeSlug}`} className="hover:underline">
            {item.treeName}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
