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
  const t_common = useTranslations('common')

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || t_common('confirm')}</DialogTitle>
          <DialogDescription className="my-2">{description || ''}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {t_common('cancel')}
          </Button>
          <Button variant="default" onClick={onConfirm} className="font-bold">
            {t_common('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
