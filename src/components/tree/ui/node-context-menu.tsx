'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Trash } from 'lucide-react'

interface NodeContextMenuProps {
  visible: boolean
  x: number
  y: number
  nodeId: string | null
  onDelete: () => void
  onClose: () => void
}

export function NodeContextMenu({
  visible,
  x,
  y,
  nodeId,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  const t_toasts = useTranslations('toasts')

  if (!visible || !nodeId) return null

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
          className="border-ocean-200/50 z-50 min-w-32 rounded-md border bg-white shadow-lg"
          side="bottom"
          align="start"
        >
          <DropdownMenu.Item
            className="hover:bg-ocean-50/50 focus:bg-ocean-50/50 text-ocean-400 flex w-full cursor-pointer items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
            onSelect={() => {
              onDelete()
              onClose()
            }}
          >
            <div> {t_toasts('node-delete')}</div>
            <Trash size={20} className="text-ocean-300" />
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
