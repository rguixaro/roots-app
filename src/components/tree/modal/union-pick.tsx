'use client'

import { JSX } from 'react'
import { useTranslations } from 'next-intl'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/ui'

import { TreeNode, Union } from '@/types'

interface UnionPickModalProps {
  open: boolean
  parentId: string | null
  childId: string | null
  candidates: Union[]
  nodes: TreeNode[]
  onPick: (unionId: string) => void
  onCancel: () => void
}

export function UnionPickModal({
  open,
  parentId,
  childId,
  candidates,
  nodes,
  onPick,
  onCancel,
}: UnionPickModalProps): JSX.Element {
  const t_common = useTranslations('common')
  const t_toasts = useTranslations('toasts')

  const nameOf = (id: string | null | undefined): string => {
    if (!id) return ''
    const n = nodes.find((x) => x.id === id)
    return n?.fullName ?? ''
  }

  const parentName = nameOf(parentId)
  const childName = nameOf(childId)

  const labelFor = (u: Union): string => {
    const other = u.spouseAId === parentId ? u.spouseBId : u.spouseAId
    if (!other) return t_toasts('union-pick-single-parent')
    return t_toasts('union-pick-with', { name: nameOf(other) })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="text-ocean-400">
        <DialogHeader>
          <DialogTitle>{t_toasts('union-pick-title')}</DialogTitle>
          <DialogDescription className="my-2">
            {t_toasts('union-pick-description', { parent: parentName, child: childName })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          {candidates.map((u) => (
            <Button
              key={u.id}
              variant="outline"
              className="justify-start"
              onClick={() => onPick(u.id)}
            >
              {labelFor(u)}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {t_common('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
