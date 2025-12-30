'use client'

import React, { useCallback, useRef } from 'react'
import {
  Plus,
  Minimize2,
  ChevronLeft,
  Logs,
  ArrowDownToLine,
  Settings2,
  CalendarDays,
  ScanSearch,
} from 'lucide-react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCopyToClipboard } from '@/hooks'

import { cn } from '@/utils'

import { Tree } from '@/types'

interface TreeOverlayProps {
  readonly: boolean
  tree: Tree
  viewingOptionsEnabled: boolean
  onCreateNode: () => void
  onResetView: () => void
  onFocus: () => void
}

/**
 * Animation variants for overlay panels sliding in from edges
 */
const slideFromLeft: Variants = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, delay: 0.2 },
  },
}

const slideFromTop: Variants = {
  hidden: { y: -50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, delay: 0.2 },
  },
}

const slideFromRight: Variants = {
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, delay: 0.2 },
  },
}

const slideFromBottom: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, delay: 0.2 },
  },
}

/**
 * Icon button hover animation
 */
const iconButtonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
  tap: { scale: 0.95 },
}

/**
 * Reusable icon button wrapper with animation
 */
function IconButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <motion.button
      type="button"
      variants={iconButtonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        'bg-ocean-300 cursor-pointer rounded p-1',
        'group transition-colors duration-300',
        'outline-none focus:outline-none focus-visible:outline-none',
        className
      )}
    >
      {children}
    </motion.button>
  )
}

/**
 * Reusable icon link wrapper with animation
 */
function IconLink({
  children,
  href,
  className,
}: {
  children: React.ReactNode
  href: string
  className?: string
}) {
  return (
    <motion.div variants={iconButtonVariants} initial="idle" whileHover="hover" whileTap="tap">
      <Link
        href={href}
        className={cn(
          'bg-ocean-300 block cursor-pointer rounded p-1',
          'group transition-colors duration-300',
          'outline-none focus:outline-none focus-visible:outline-none',
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  )
}

export function TreeOverlay({
  readonly,
  tree,
  viewingOptionsEnabled,
  onCreateNode,
  onResetView,
  onFocus,
}: TreeOverlayProps) {
  const t_common = useTranslations('common')

  const iconClassName = 'text-ocean-50 group-hover:text-pale-ocean transition-colors duration-300'

  const downloadRef = useRef<HTMLDivElement>(null)
  const { copy } = useCopyToClipboard()

  const handleDownload = useCallback(() => {
    toast.info(t_common('unavailable-feature'))
  }, [tree?.slug])

  return (
    <div>
      <div
        ref={downloadRef}
        className="pointer-events-none fixed inset-0 -z-50 opacity-0"
        aria-hidden="true"
      >
        <div className="react-flow-container" />
      </div>
      <motion.div
        variants={slideFromLeft}
        initial="hidden"
        animate="visible"
        className={cn(
          'shadow-center-lg absolute top-0 left-0 z-10',
          'bg-ocean-400 rounded-lg rounded-t-none rounded-l-none ps-1 pe-3 pt-2 pb-4'
        )}
      >
        <IconLink href="/">
          <ChevronLeft size={20} className={iconClassName} />
        </IconLink>
      </motion.div>
      <motion.div
        variants={slideFromTop}
        initial="hidden"
        animate="visible"
        className={cn(
          'bg-ocean-400 absolute top-0 right-0 z-10 flex gap-4 px-4 pt-1 pb-3 sm:right-auto sm:left-1/2 sm:-translate-x-1/2',
          'shadow-center-lg items-center rounded-lg rounded-t-none rounded-br-none sm:rounded-br-lg',
          'max-w-[70vw] sm:max-w-none'
        )}
      >
        <span className="text-ocean-50 text-lg font-extrabold md:text-xl">{tree.name}</span>
        <div className="bg-ocean-300 hidden h-4 w-0.5 sm:block" />
        {!readonly && (
          <IconButton onClick={onCreateNode} className="hidden sm:block">
            <Plus size={20} className={iconClassName} />
          </IconButton>
        )}
        <IconButton onClick={onResetView} className="hidden sm:block">
          <Minimize2 size={20} className={iconClassName} />
        </IconButton>
        {viewingOptionsEnabled && (
          <IconButton onClick={onFocus} className="hidden sm:block">
            <ScanSearch size={20} className={iconClassName} />
          </IconButton>
        )}
      </motion.div>
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        className={cn(
          'bg-ocean-400 absolute top-0 right-0 z-10 hidden flex-col gap-4 ps-3 pe-1 pt-2 pb-4 sm:flex',
          'shadow-center-lg items-center justify-center rounded-lg rounded-t-none rounded-r-none rounded-bl-lg'
        )}
      >
        <IconLink href={`/trees/timeline/${tree?.slug}`}>
          <CalendarDays size={20} className={iconClassName} />
        </IconLink>
        <IconButton onClick={handleDownload}>
          <ArrowDownToLine size={20} className={iconClassName} />
        </IconButton>
        {!readonly && (
          <>
            <div className="bg-ocean-300 h-0.5 w-4" />
            <IconLink href={`/trees/logs/${tree?.slug}`}>
              <Logs size={20} className={iconClassName} />
            </IconLink>
            <IconLink href={`/trees/edit/${tree?.slug}`}>
              <Settings2 size={20} className={iconClassName} />
            </IconLink>
          </>
        )}
      </motion.div>
      <motion.div
        variants={slideFromBottom}
        initial="hidden"
        animate="visible"
        className={cn(
          'bg-ocean-400 absolute right-0 bottom-0 left-0 z-10 flex gap-4 px-4 pt-3 pb-1 sm:hidden',
          'shadow-center-lg items-center',
          !readonly ? 'justify-between' : 'justify-center gap-8'
        )}
      >
        {!readonly && (
          <IconButton onClick={onCreateNode}>
            <Plus size={20} className={iconClassName} />
          </IconButton>
        )}
        <IconButton onClick={onResetView}>
          <Minimize2 size={20} className={iconClassName} />
        </IconButton>
        {viewingOptionsEnabled && (
          <IconButton onClick={onFocus}>
            <ScanSearch size={20} className={iconClassName} />
          </IconButton>
        )}
        <IconLink href={`/trees/timeline/${tree?.slug}`}>
          <CalendarDays size={20} className={iconClassName} />
        </IconLink>
        <IconButton onClick={handleDownload}>
          <ArrowDownToLine size={20} className={iconClassName} />
        </IconButton>
        {!readonly && (
          <div className="flex w-full items-center justify-end gap-4">
            <div className="bg-ocean-300 h-4 w-0.5" />
            <IconLink href={`/trees/logs/${tree?.slug}`}>
              <Logs size={20} className={iconClassName} />
            </IconLink>
            <IconLink href={`/trees/edit/${tree?.slug}`}>
              <Settings2 size={20} className={iconClassName} />
            </IconLink>
          </div>
        )}
      </motion.div>
    </div>
  )
}
