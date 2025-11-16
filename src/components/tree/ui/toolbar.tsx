'use client'

import React from 'react'
import { Plus, Minimize2 } from 'lucide-react'
import { cn } from '@/utils'

interface TreeToolbarProps {
  onCreateNode: () => void
  onResetView: () => void
}

export function TreeToolbar({ onCreateNode, onResetView }: TreeToolbarProps) {
  return (
    <div
      className={cn(
        'bg-ocean-50 absolute left-1/2 z-10 flex -translate-x-1/2 gap-4 px-4 py-1',
        'border-ocean-400/15 items-center rounded-lg rounded-t-none border-4 border-t-0 shadow-lg'
      )}
    >
      <div
        onClick={onCreateNode}
        className={cn(
          'hover:bg-ocean-100/50 bg-ocean-50 cursor-pointer rounded p-1',
          'transition-colors duration-300'
        )}
      >
        <Plus size={20} className="text-ocean-400" />
      </div>
      <div className="bg-ocean-100 h-5 w-0.5" />
      <div
        onClick={onResetView}
        className={cn(
          'hover:bg-ocean-100/50 bg-ocean-50 cursor-pointer rounded p-1',
          'transition-colors duration-300'
        )}
      >
        <Minimize2 size={20} className="text-ocean-400" />
      </div>
    </div>
  )
}
