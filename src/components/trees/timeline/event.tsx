'use client'

import { JSX, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

import { cn } from '@/utils'

export type Orientation = 'horizontal' | 'vertical'

/**
 * Animated timeline event container
 * @param param0 { offset: number; orientation: Orientation; className?: string; children?: React.ReactNode } - Props
 * @returns {JSX.Element}
 */
export function AnimatedEvent({
  offset,
  orientation,
  className,
  children,
}: {
  offset: number
  orientation: Orientation
  className?: string
  children?: React.ReactNode
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' })

  const isHorizontal = orientation === 'horizontal'

  return (
    <motion.div
      ref={ref}
      className={cn(
        'absolute',
        isHorizontal ? '-translate-y-1/2' : '-translate-x-1/2',
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={
        isInView
          ? isHorizontal
            ? { opacity: 1, x: offset }
            : { opacity: 1, y: offset }
          : isHorizontal
            ? { x: offset }
            : { y: offset }
      }
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}
