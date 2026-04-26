'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Pencil, Trash, UserPlus } from 'lucide-react'

import { cn } from '@/utils'

interface EdgeContextMenuProps {
  visible: boolean
  x: number
  y: number
  edgeId: string | null
  onDelete: () => void
  onAddChild?: () => void
  onEditUnion?: () => void
  onClose: () => void
}

export function EdgeContextMenu({
  visible,
  x,
  y,
  edgeId,
  onDelete,
  onAddChild,
  onEditUnion,
  onClose,
}: EdgeContextMenuProps) {
  const t_toasts = useTranslations('toasts')

  // keep the Root mounted while closing so the menu-out keyframe can play
  if (!edgeId) return null

  return (
    <DropdownMenu.Root
      open={visible}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DropdownMenu.Trigger asChild>
        <div
          className="pointer-events-none fixed"
          style={{ left: x, top: y, width: 1, height: 1 }}
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'border-ocean-200 shadow-center bg-pale-ocean z-50 min-w-40 rounded-lg border-2 p-1',
            'origin-top',
            'data-[state=open]:animate-menu-in',
            'data-[state=closed]:animate-menu-out'
          )}
          side="bottom"
          align="start"
          sideOffset={6}
          onPointerDownOutside={(e) => {
            // edge buttons live outside the portal; let their onClick handle toggle
            const target = e.target as HTMLElement | null
            if (target?.closest('[data-edge-menu-trigger="true"]')) {
              e.preventDefault()
            }
          }}
        >
          {onAddChild && (
            <DropdownMenu.Item
              className="hover:bg-ocean-50/50 focus:bg-ocean-50/50 text-ocean-400 flex w-full cursor-pointer items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
              onSelect={() => {
                onAddChild()
                onClose()
              }}
            >
              <UserPlus size={18} className="text-ocean-300" />
              <div>{t_toasts('edge-add-child')}</div>
            </DropdownMenu.Item>
          )}
          {onEditUnion && (
            <DropdownMenu.Item
              className="hover:bg-ocean-50/50 focus:bg-ocean-50/50 text-ocean-400 flex w-full cursor-pointer items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
              onSelect={() => {
                onEditUnion()
                onClose()
              }}
            >
              <Pencil size={18} className="text-ocean-300" />
              <div>{t_toasts('edge-edit-union')}</div>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            className="hover:bg-ocean-50/50 focus:bg-ocean-50/50 text-ocean-400 flex w-full cursor-pointer items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
            onSelect={() => {
              onDelete()
              onClose()
            }}
          >
            <Trash size={18} className="text-ocean-300" />
            <div>{t_toasts('edge-delete')}</div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
