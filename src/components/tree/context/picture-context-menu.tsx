'use client'

import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowDownToLine, Tags, Trash2, UserCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/utils'

import { Picture } from '@/types'

interface PictureContextMenuProps {
  visible: boolean
  x: number
  y: number
  readonly: boolean
  picture: Picture | null
  profilePictureId?: string | null
  onDownload: (fileKey: string) => void
  onTags: (picture: Picture) => void
  onDelete: (pictureId: string) => void
  onSetProfile: (pictureId: string) => void
  onClose: () => void
}

export function PictureContextMenu({
  visible,
  x,
  y,
  readonly,
  picture,
  profilePictureId,
  onDownload,
  onTags,
  onDelete,
  onSetProfile,
  onClose,
}: PictureContextMenuProps) {
  const t_common = useTranslations('common')
  const t_toasts = useTranslations('toasts')

  if (!visible || !picture) return null

  const className =
    'hover:bg-ocean-100/50 focus:bg-ocean-100/50 text-ocean-400 flex w-full cursor-pointer items-center gap-2 rounded-md mt-2 px-3 py-2 text-sm transition-colors'
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
          className="border-ocean-200 shadow-center bg-pale-ocean z-50 min-w-40 rounded-lg border-2"
          side="bottom"
          align="start"
        >
          <DropdownMenu.Item
            className={cn(className, 'mt-0')}
            onSelect={() => {
              onDownload(picture.fileKey)
              onClose()
            }}
          >
            <ArrowDownToLine size={18} className="text-ocean-300" />
            <span>{t_common('download')}</span>
          </DropdownMenu.Item>
          {!readonly && (
            <DropdownMenu.Item
              className={className}
              onSelect={() => {
                onTags(picture)
                onClose()
              }}
            >
              <Tags size={18} className="text-ocean-300" />
              <span>{t_toasts('node-picture-manage-tags')}</span>
            </DropdownMenu.Item>
          )}
          {!readonly && profilePictureId !== picture.id && (
            <DropdownMenu.Item
              className={className}
              onSelect={() => {
                onSetProfile(picture.id)
                onClose()
              }}
            >
              <UserCheck size={18} className="text-ocean-300" />
              <span>{t_toasts('node-picture-set-profile')}</span>
            </DropdownMenu.Item>
          )}
          {!readonly && (
            <DropdownMenu.Item
              className={cn(className, 'text-red-500 hover:bg-red-50/70 focus:bg-red-50/70')}
              onSelect={() => {
                onDelete(picture.id)
                onClose()
              }}
            >
              <Trash2 size={18} className="text-red-400" />
              <span>{t_common('delete')}</span>
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
