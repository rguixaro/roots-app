'use client'

import { JSX, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  SearchableSelect,
} from '@/ui'

import { TreeNode, Union } from '@/types'

export interface UnionFormValues {
  spouseAId: string
  spouseBId: string | null
  marriedAt: Date | null
  divorcedAt: Date | null
  place: string | null
}

interface UnionEditModalProps {
  open: boolean
  union: Union | null
  createSeed?: { spouseAId: string; spouseBId: string | null } | null
  mode?: 'edit' | 'create'
  nodes: TreeNode[]
  onSave: (values: UnionFormValues) => Promise<void> | void
  onCancel: () => void
}

export function UnionEditModal({
  open,
  union,
  createSeed = null,
  mode = 'edit',
  nodes,
  onSave,
  onCancel,
}: UnionEditModalProps): JSX.Element {
  const t_common = useTranslations('common')
  const t_toasts = useTranslations('toasts')
  const t_errors = useTranslations('errors')

  const isCreate = mode === 'create'

  const [spouseA, setSpouseA] = useState<string>('')
  const [spouseB, setSpouseB] = useState<string>('')
  const [marriedAt, setMarriedAt] = useState<string>('')
  const [divorcedAt, setDivorcedAt] = useState<string>('')
  const [place, setPlace] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (isCreate && createSeed) {
      setSpouseA(createSeed.spouseAId)
      setSpouseB(createSeed.spouseBId ?? '')
      setMarriedAt('')
      setDivorcedAt('')
      setPlace('')
    } else if (union) {
      setSpouseA(union.spouseAId)
      setSpouseB(union.spouseBId ?? '')
      setMarriedAt(union.marriedAt ? new Date(union.marriedAt).toISOString().split('T')[0] : '')
      setDivorcedAt(
        union.divorcedAt ? new Date(union.divorcedAt).toISOString().split('T')[0] : ''
      )
      setPlace(union.place ?? '')
    }
    setSaving(false)
  }, [open, isCreate, createSeed, union])

  const SENTINEL_NONE = '__none__'

  const options = nodes.map((n) => ({ value: n.id, label: n.fullName }))
  const optionsWithNone = [
    { value: SENTINEL_NONE, label: t_toasts('union-edit-no-partner') },
    ...options,
  ]

  const divorcedBeforeMarried =
    !!marriedAt && !!divorcedAt && new Date(divorcedAt) < new Date(marriedAt)
  const selectedSpouses = [spouseA, spouseB]
    .filter((id) => id && id !== SENTINEL_NONE)
    .map((id) => nodes.find((node) => node.id === id))
    .filter((node): node is TreeNode => !!node)
  const marriedBeforeBirth =
    !!marriedAt &&
    selectedSpouses.some(
      (spouse) => spouse.birthDate && new Date(marriedAt) <= new Date(spouse.birthDate)
    )
  const marriedAfterDeath =
    !!marriedAt &&
    selectedSpouses.some(
      (spouse) => spouse.deathDate && new Date(marriedAt) >= new Date(spouse.deathDate)
    )
  const divorcedAfterDeath =
    !!divorcedAt &&
    selectedSpouses.some(
      (spouse) => spouse.deathDate && new Date(divorcedAt) >= new Date(spouse.deathDate)
    )

  const canSave =
    !!spouseA &&
    spouseA !== spouseB &&
    (spouseB === '' || spouseB !== spouseA) &&
    !divorcedBeforeMarried &&
    !marriedBeforeBirth &&
    !marriedAfterDeath &&
    !divorcedAfterDeath

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      await onSave({
        spouseAId: spouseA,
        spouseBId: spouseB && spouseB !== SENTINEL_NONE ? spouseB : null,
        marriedAt: marriedAt ? new Date(marriedAt) : null,
        divorcedAt: divorcedAt ? new Date(divorcedAt) : null,
        place: place.trim() ? place.trim() : null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onCancel()}>
      <DialogContent className="text-ocean-400">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? t_toasts('union-create-title') : t_toasts('union-edit-title')}
          </DialogTitle>
          <DialogDescription className="my-2">
            {isCreate
              ? t_toasts('union-create-description')
              : t_toasts('union-edit-description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ocean-300 font-medium">{t_toasts('union-edit-spouse-a')}</span>
            <SearchableSelect
              options={options}
              value={spouseA}
              onValueChange={setSpouseA}
              disabled={saving || isCreate}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ocean-300 font-medium">{t_toasts('union-edit-spouse-b')}</span>
            <SearchableSelect
              options={optionsWithNone}
              value={spouseB || SENTINEL_NONE}
              onValueChange={(v) => setSpouseB(v === SENTINEL_NONE ? '' : v)}
              disabled={saving || isCreate}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ocean-300 font-medium">
              {t_toasts('union-edit-married-at')}
            </span>
            <Input
              type="date"
              className="w-fit"
              value={marriedAt}
              onChange={(e) => setMarriedAt(e.target.value)}
              disabled={saving}
            />
            {marriedBeforeBirth && (
              <span className="text-destructive text-xs">
                {t_errors('error-married-before-birth')}
              </span>
            )}
            {marriedAfterDeath && (
              <span className="text-destructive text-xs">
                {t_errors('error-married-after-death')}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ocean-300 font-medium">
              {t_toasts('union-edit-divorced-at')}
            </span>
            <Input
              type="date"
              className="w-fit"
              value={divorcedAt}
              onChange={(e) => setDivorcedAt(e.target.value)}
              disabled={saving}
            />
            {divorcedBeforeMarried && (
              <span className="text-destructive text-xs">
                {t_errors('error-divorced-before-married')}
              </span>
            )}
            {divorcedAfterDeath && (
              <span className="text-destructive text-xs">
                {t_errors('error-divorced-after-death')}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ocean-300 font-medium">{t_toasts('union-edit-place')}</span>
            <Input
              type="text"
              maxLength={120}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              disabled={saving}
              placeholder={t_toasts('union-edit-place-placeholder')}
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            {t_common('cancel')}
          </Button>
          <Button variant="default" onClick={handleSave} disabled={!canSave || saving}>
            {saving
              ? isCreate
                ? t_common('creating')
                : t_common('saving')
              : isCreate
                ? t_common('create')
                : t_common('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
