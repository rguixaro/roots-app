'use client'

import React from 'react'
import { Plus, Minimize2, ChevronLeft, Logs } from 'lucide-react'
import Link from 'next/link'

import { TreeShare } from '@/components/trees/share'
import { TreeDownload } from '@/components/trees/download'
import { TreeEdit } from '@/components/trees/edit'

import { cn } from '@/utils'

import { Tree } from '@/types'

interface TreeOverlayProps {
  readonly: boolean
  tree: Tree
  onCreateNode: () => void
  onResetView: () => void
}

export function TreeOverlay({ readonly, tree, onCreateNode, onResetView }: TreeOverlayProps) {
  const btnClassName = 'text-pale-ocean group hover:bg-transparent'
  const iconClassName = 'text-pale-ocean group-hover:text-ocean-300 transition-colors duration-300'
  return (
    <div>
      <Link
        href={'/'}
        className={cn(
          'group shadow-center-lg absolute left-0 z-10 rounded-lg',
          'bg-ocean-100 rounded-lg rounded-t-none rounded-l-none ps-1 pe-3 pt-2 pb-4'
        )}
      >
        <ChevronLeft size={20} className={iconClassName} />
      </Link>
      <div
        className={cn(
          'bg-ocean-100 absolute right-0 z-10 flex gap-4 px-4 pt-1 pb-3 sm:right-auto sm:left-1/2 sm:-translate-x-1/2',
          'shadow-center-lg items-center rounded-lg rounded-t-none rounded-br-none sm:rounded-br-lg'
        )}
      >
        <span className="text-pale-ocean text-lg font-extrabold md:text-xl">{tree.name}</span>
        <div className="bg-ocean-50 hidden h-4 w-0.5 sm:block" />
        <div
          onClick={onCreateNode}
          className={cn(
            'bg-ocean-100 hidden cursor-pointer rounded p-1 sm:block',
            'group transition-all duration-300'
          )}
        >
          <Plus size={20} className={iconClassName} />
        </div>
        <div
          onClick={onResetView}
          className={cn(
            'bg-ocean-100 hidden cursor-pointer rounded p-1 sm:block',
            'group transition-all duration-300'
          )}
        >
          <Minimize2 size={20} className={iconClassName} />
        </div>
      </div>
      <div
        className={cn(
          'bg-ocean-100 absolute top-0 right-0 z-10 hidden flex-col gap-4 ps-3 pe-1 pt-2 pb-4 sm:flex',
          'shadow-center-lg items-center justify-center rounded-lg rounded-t-none rounded-r-none rounded-bl-lg'
        )}
      >
        <TreeShare tree={tree} className={btnClassName} classNameIcon={iconClassName} />
        <TreeDownload tree={tree} className={btnClassName} classNameIcon={iconClassName} />
        {!readonly && (
          <>
            <div className="bg-ocean-50 h-0.5 w-4" />
            <Link
              href={`/trees/logs/${tree?.slug}`}
              className={cn(
                'bg-ocean-100 cursor-pointer rounded p-1',
                'group transition-all duration-300'
              )}
            >
              <Logs size={20} className={iconClassName} />
            </Link>
            <TreeEdit tree={tree} className={btnClassName} classNameIcon={iconClassName} />
          </>
        )}
      </div>
      <div
        className={cn(
          'bg-ocean-100 absolute right-0 bottom-0 left-0 z-10 flex gap-4 px-4 py-1 pt-3 sm:hidden',
          'shadow-center-lg items-center',
          !readonly ? 'justify-between' : 'justify-center gap-8'
        )}
      >
        <div
          onClick={onCreateNode}
          className={cn(
            'bg-ocean-100 cursor-pointer rounded p-1',
            'group transition-all duration-300'
          )}
        >
          <Plus size={20} className={iconClassName} />
        </div>
        <div
          onClick={onResetView}
          className={cn(
            'bg-ocean-100 cursor-pointer rounded p-1',
            'group transition-all duration-300'
          )}
        >
          <Minimize2 size={20} className={iconClassName} />
        </div>
        <TreeShare tree={tree} className={btnClassName} classNameIcon={iconClassName} />
        <TreeDownload tree={tree} className={btnClassName} classNameIcon={iconClassName} />
        {!readonly && (
          <div className="flex w-full items-center justify-end gap-4">
            <div className="bg-ocean-50 h-4 w-0.5 sm:hidden" />
            <Link
              href={`/trees/logs/${tree?.slug}`}
              className={cn(
                'bg-ocean-100 cursor-pointer rounded p-1',
                'group transition-all duration-300'
              )}
            >
              <Logs size={20} className={iconClassName} />
            </Link>
            <TreeEdit tree={tree} className={btnClassName} classNameIcon={iconClassName} />
          </div>
        )}
      </div>
    </div>
  )
}
