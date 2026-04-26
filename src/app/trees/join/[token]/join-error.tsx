'use client'

import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { LinkIcon } from 'lucide-react'

import { TypographyH4 } from '@/ui'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 200, damping: 15 },
  },
}

const textVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const linkVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
  tap: { scale: 0.98 },
}

interface JoinErrorProps {
  title: string
  returnText: string
}

export function JoinError({ title, returnText }: JoinErrorProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-ocean-300 bg-pale-ocean flex h-screen flex-col items-center justify-center space-y-4"
    >
      <motion.div variants={iconVariants}>
        <LinkIcon size={64} className="text-ocean-400" />
      </motion.div>

      <motion.div variants={textVariants}>
        <TypographyH4 className="text-ocean-400 mt-2 mb-5 text-center">{title}</TypographyH4>
      </motion.div>

      <motion.div variants={textVariants}>
        <Link href="/">
          <motion.span
            variants={linkVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            className="mt-12 inline-block font-medium underline decoration-dotted underline-offset-4"
          >
            {returnText}
          </motion.span>
        </Link>
      </motion.div>
    </motion.div>
  )
}
