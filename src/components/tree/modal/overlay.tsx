'use client'

import React from 'react'
import {
  ChevronLeft,
  NotebookPen,
  Plus,
  Maximize,
  Crosshair,
  ImageDown,
  LoaderIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { cn } from '@/utils'

import { Tree } from '@/types'

interface TreeOverlayProps {
  readonly: boolean
  tree: Tree
  viewingOptionsEnabled: boolean
  onCreateNode: () => void
  onResetView: () => void
  onFocus: () => void
  onExportImage: () => void
  exportingImage: boolean
}

function ToolButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'text-ocean-300 hover:text-ocean-400 hover:bg-ocean-100/40',
        'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full',
        'transition-[transform,color,background-color] duration-150 hover:scale-110',
        'focus-visible:ring-ocean-200 outline-none focus-visible:ring-2',
        className
      )}
    >
      {children}
    </button>
  )
}

function ToolLink({
  label,
  href,
  children,
  className,
}: {
  label: string
  href: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={cn(
        'text-ocean-300 hover:text-ocean-400 hover:bg-ocean-100/40',
        'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full',
        'transition-[transform,color,background-color] duration-150 hover:scale-110',
        'focus-visible:ring-ocean-200 outline-none focus-visible:ring-2',
        className
      )}
    >
      {children}
    </Link>
  )
}

export function TreeOverlay({
  readonly,
  tree,
  viewingOptionsEnabled,
  onCreateNode,
  onResetView,
  onFocus,
  onExportImage,
  exportingImage,
}: TreeOverlayProps) {
  const t_common = useTranslations('common')
  const t_trees = useTranslations('trees')
  const t_treeInfo = useTranslations('tree-info')

  return (
    <>
      <div
        className={cn(
          'absolute top-3 left-1/2 z-10 -translate-x-1/2',
          'animate-menu-in origin-top',
          'flex max-w-[calc(100vw-1rem)] items-center gap-1',
          'border-ocean-200/60 bg-pale-ocean/95 shadow-center rounded-full border px-2 py-1.5',
          'backdrop-blur-sm'
        )}
      >
        <ToolLink href={`/trees/${tree?.slug}`} label={t_common('return')}>
          <ChevronLeft size={18} />
        </ToolLink>
        <span
          className={cn(
            'text-ocean-400 px-2 text-sm font-bold sm:text-base',
            'line-clamp-2 max-w-56 leading-tight sm:max-w-[20rem]'
          )}
          title={tree.name}
        >
          {tree.name}
        </span>
        {tree.deletionRequest && (
          <span className="bg-ocean-100/60 text-ocean-400 rounded-full px-2 py-0.5 text-xs font-bold">
            {t_trees('tree-pending-deletion')}
          </span>
        )}
        <div className="bg-ocean-200/60 mx-1 h-5 w-px" />
        <ToolLink href={`/trees/notes/${tree?.slug}?from=view`} label={t_common('notes')}>
          <NotebookPen size={18} />
        </ToolLink>
        <ToolButton onClick={onResetView} label={t_common('reset-view')}>
          <Maximize size={18} />
        </ToolButton>
        <ToolButton
          onClick={onExportImage}
          label={t_treeInfo('action-export-image')}
          className={exportingImage ? 'cursor-wait opacity-70' : undefined}
        >
          {exportingImage ? (
            <LoaderIcon size={18} className="animate-spin" />
          ) : (
            <ImageDown size={18} />
          )}
        </ToolButton>
        {viewingOptionsEnabled && (
          <ToolButton onClick={onFocus} label={t_common('focus-mode')}>
            <Crosshair size={18} />
          </ToolButton>
        )}
      </div>

      {!readonly && (
        <button
          type="button"
          onClick={onCreateNode}
          aria-label={t_common('add-member')}
          className={cn(
            'absolute bottom-6 left-1/2 z-10 -translate-x-1/2',
            'animate-menu-in origin-bottom',
            'flex h-12 items-center gap-2 px-5',
            'bg-ocean-300 hover:bg-ocean-400 text-pale-ocean',
            'shadow-center cursor-pointer rounded-2xl',
            'transition-colors duration-150',
            'focus-visible:ring-ocean-200 outline-none focus-visible:ring-2'
          )}
        >
          <Plus size={20} strokeWidth={2.5} />
          <span className="text-sm font-bold">{t_common('add-member')}</span>
        </button>
      )}
    </>
  )
}
