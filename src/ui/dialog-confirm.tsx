'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog'
import { Button } from '@/ui'
import { useTranslations } from 'next-intl'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const t = useTranslations('common')

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || 'Are you sure?'}</DialogTitle>
          <DialogDescription>{description || 'This action cannot be undone.'}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} className="my-2">
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="my-2">
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
