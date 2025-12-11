'use client'

import React from 'react'
import { LoaderIcon } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { type z } from 'zod'

import { UpdateTreeNodeSchema } from '@/server/schemas'

import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  TypographyH5,
} from '@/ui'

import { TreeNode, TreeType } from '@/types'

interface NodeInfoTabGeneralProps {
  readonly: boolean
  treeType: TreeType
  node: TreeNode | null
  form: UseFormReturn<z.infer<typeof UpdateTreeNodeSchema>>
  loading: boolean
  editMode: boolean
  isMobile: boolean
  onEditModeChange: (editMode: boolean) => void
  onDelete: () => void
  t_common: (key: string) => string
  t_trees: (key: string) => string
  t_toasts: (key: string) => string
}

export function NodeInfoTabGeneral({
  readonly,
  treeType,
  node,
  form,
  loading,
  editMode,
  isMobile,
  onEditModeChange,
  onDelete,
  t_common,
  t_trees,
  t_toasts,
}: NodeInfoTabGeneralProps) {
  const fullName = form.watch('fullName')
  const alias = form.watch('alias')
  const birthPlace = form.watch('birthPlace')
  const birthDate = form.watch('birthDate')
  const deathDate = form.watch('deathDate')
  const gender = form.watch('gender')
  const biography = form.watch('biography')

  return (
    <>
      {!isMobile && <TypographyH5>{t_trees('node-general-info')}</TypographyH5>}
      <div className="border-ocean-200/50 shadow-center-sm mb-2 flex-col items-start rounded-lg border-2 bg-white px-3 py-2 text-left">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="w-fit">
              <FormLabel>{t_trees('node-fullname')}</FormLabel>
              <FormControl>
                <div className="py-2">
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder={t_trees('node-fullname')}
                    disabled={!editMode || loading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="alias"
          render={({ field }) => (
            <FormItem className="mt-3">
              <FormLabel>{t_trees('node-alias')}</FormLabel>
              <FormControl>
                <div className="py-2">
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    autoComplete="off"
                    className="min-w-[16ch]"
                    placeholder={t_trees('node-alias')}
                    disabled={!editMode || loading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
        <FormField
          control={form.control}
          name="birthPlace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t_trees('node-birth-place')}</FormLabel>
              <FormControl>
                <div className="py-2">
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    autoComplete="off"
                    className="min-w-[16ch]"
                    placeholder={t_trees('node-birth-place')}
                    disabled={!editMode || loading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem className="mt-3">
              <FormLabel>{t_trees('node-birth-date')}</FormLabel>
              <FormControl>
                <div className="py-2">
                  <Input
                    {...field}
                    className="w-fit"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? new Date(e.target.value) : null)
                    }
                    type="date"
                    autoComplete="off"
                    placeholder={t_trees('node-birth-date')}
                    disabled={!editMode || loading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deathDate"
          render={({ field }) => (
            <FormItem className="mt-3">
              <FormLabel>{t_trees('node-death-date')}</FormLabel>
              <FormControl>
                <div className="py-2">
                  <Input
                    {...field}
                    className="w-fit"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? new Date(e.target.value) : null)
                    }
                    type="date"
                    autoComplete="off"
                    placeholder={t_trees('node-death-date')}
                    disabled={!editMode || loading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t_trees('node-gender')}</FormLabel>
              <FormControl>
                <div className="py-2">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={!editMode || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={'-'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">
                        {t_trees(`${'node-gender-male'}${treeType === 'ANIMAL' ? '-animal' : ''}`)}
                      </SelectItem>
                      <SelectItem value="FEMALE">
                        {t_trees(
                          `${'node-gender-female'}${treeType === 'ANIMAL' ? '-animal' : ''}`
                        )}
                      </SelectItem>
                      <SelectItem value="OTHER">{t_trees('node-gender-other')}</SelectItem>
                      <SelectItem value="UNSPECIFIED">
                        {t_trees('node-gender-unspecified')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
        <FormField
          control={form.control}
          name="biography"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t_trees('node-biography')}</FormLabel>
              <FormDescription className="mb-2 text-sm opacity-70">
                {t_trees('node-biography-description')}
              </FormDescription>
              <FormControl>
                <div className="py-2">
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    autoComplete="off"
                    className="min-w-[16ch]"
                    disabled={!editMode || loading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="my-6 flex gap-3">
        {!editMode && !readonly && (
          <Button type="button" onClick={() => onEditModeChange(true)} disabled={loading}>
            <span className="text-sm font-bold">{t_trees('node-info-edit')}</span>
          </Button>
        )}
        {editMode && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onEditModeChange(false)}
            disabled={loading}
          >
            <span className="text-sm font-bold">{t_common('cancel')}</span>
          </Button>
        )}
        {editMode && (
          <Button
            type="submit"
            disabled={
              loading ||
              (fullName === node?.fullName &&
                (birthDate ? new Date(birthDate).toISOString() : '') ===
                  (node?.birthDate ? new Date(node.birthDate).toISOString() : '') &&
                (deathDate ? new Date(deathDate).toISOString() : '') ===
                  (node?.deathDate ? new Date(node.deathDate).toISOString() : '') &&
                gender === node?.gender &&
                birthPlace === node?.birthPlace &&
                biography === node?.biography &&
                alias === node?.alias)
            }
          >
            <div className="flex items-center space-x-3">
              {loading && <LoaderIcon size={16} className="animate-spin" />}
              <span className="text-sm font-bold">
                {loading ? t_common('updating') : t_common('update')}
              </span>
            </div>
          </Button>
        )}
      </div>
      {editMode && (
        <div className="mt-auto self-start">
          <Button type="button" variant="ghost" onClick={onDelete} disabled={loading}>
            <span className="text-sm font-bold">{t_toasts('node-delete')}</span>
          </Button>
        </div>
      )}
    </>
  )
}
