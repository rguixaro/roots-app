'use client'

import { JSX, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

import { cn } from '@/utils'

/**
 * Animated timeline event container
 * @param param0 { x: number; className?: string; children?: React.ReactNode } - Props
 * @returns {JSX.Element}
 */
export function AnimatedEvent({
  x,
  className,
  children,
}: {
  x: number
  className?: string
  children?: React.ReactNode
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' })

  return (
    <motion.div
      ref={ref}
      className={cn('absolute -translate-y-1/2', className)}
      initial={{ opacity: 0, y: -10 }}
      animate={isInView ? { opacity: 1, x } : { x }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}
