'use client'

import React from 'react'
import { Plus, Minimize2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { GoBack } from '@/components/layout'
import { FamilyShare } from '@/components/families/share'
import { FamilyDownload } from '@/components/families/download'
import { FamilyEdit } from '@/components/families/edit'

import { cn } from '@/utils'

import { Family } from '@/types'

interface TreeToolbarProps {
  readonly: boolean
  family: Family
  onCreateNode: () => void
  onResetView: () => void
}

export function TreeToolbar({ readonly, family, onCreateNode, onResetView }: TreeToolbarProps) {
  const btnClassName = 'text-pale-ocean group hover:bg-transparent'
  const iconClassName = 'text-pale-ocean group-hover:text-ocean-300 transition-colors duration-300'
  return (
    <div>
      <div className="absolute left-0 z-10 hidden rounded-lg sm:block">
        <GoBack
          text={'families'}
          className={cn(
            'bg-ocean-100 rounded-lg rounded-t-none rounded-l-none py-1 ps-0 pe-4 pb-2',
            'hover:bg-ocean-100 group bg-none shadow-lg transition-all duration-300'
          )}
          classNameSvg="group-hover:stroke-ocean-300 stroke-pale-ocean"
          classNameHover="group-hover:text-ocean-300 text-pale-ocean hover:bg-transparent"
        />
      </div>
      <Link
        href={'/'}
        className={cn(
          'absolute left-0 z-10 rounded-lg sm:hidden',
          'bg-ocean-100 rounded-lg rounded-t-none rounded-l-none py-1 ps-1 pe-3 pt-2 pb-4'
        )}
      >
        <ChevronLeft size={20} className={iconClassName} />
      </Link>
      <div
        className={cn(
          'bg-ocean-100 absolute right-0 z-10 flex gap-4 px-4 py-1 pb-3 sm:right-auto sm:left-1/2 sm:-translate-x-1/2',
          'items-center rounded-lg rounded-t-none rounded-br-none shadow-lg sm:rounded-br-lg'
        )}
      >
        <span className="text-pale-ocean text-lg font-extrabold md:text-xl">{family.name}</span>{' '}
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
          'bg-ocean-100 absolute bottom-0 left-0 z-10 flex gap-4 px-4 py-1 pt-3 sm:hidden',
          'items-center rounded-lg rounded-tl-none rounded-b-none shadow-lg'
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
      </div>
      <div
        className={cn(
          'bg-ocean-100 absolute right-0 bottom-0 z-10 flex gap-4 px-4 py-1 pt-2 sm:bottom-auto sm:pt-1 sm:pb-2',
          'items-center rounded-lg rounded-r-none rounded-b-none shadow-lg sm:rounded-t-none sm:rounded-bl-lg'
        )}
      >
        <FamilyShare family={family} className={btnClassName} classNameIcon={iconClassName} />
        <FamilyDownload family={family} className={btnClassName} classNameIcon={iconClassName} />
        {!readonly && (
          <FamilyEdit family={family} className={btnClassName} classNameIcon={iconClassName} />
        )}
      </div>
    </div>
  )
}
