'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'
import * as Tabs from '@radix-ui/react-tabs'

import { CreateTreeSchema, TreeType } from '@/server/schemas'
import { createTree, inviteMember, removeMember } from '@/server/actions'

import { GoBack } from '@/components/layout'
import { StyledSelector } from '@/components/trees/form'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  ConfirmDialog,
  TypographyH5,
  TypographyH4,
} from '@/ui'

import { Tree, TreeAccessRole } from '@/types'

import { checkKeyDown, isValidEmail } from '@/utils'

interface CreateTreeProps {
  userId: string
}

export const CreateTree = ({ userId: currentUserId }: CreateTreeProps) => {
  const t_common = useTranslations('common')
  const t_trees = useTranslations('trees')
  const t_errors = useTranslations('errors')
  const t_toasts = useTranslations('toasts')

  const [loading, setLoading] = useState<boolean>(false)
  const [currentTree, setCurrentTree] = useState<Tree>()
  const [currentTab, setCurrentTab] = useState<'general' | 'members'>('general')
  const [canAccessMembers, setCanAccessMembers] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currMember, setCurrMember] = useState<{ index: number; memberId?: string } | null>(null)

  const form = useForm<z.infer<typeof CreateTreeSchema>>({
    resolver: zodResolver(CreateTreeSchema),
    defaultValues: {
      name: '',
      compact: false,
      nodeImage: undefined,
      nodeGallery: undefined,
      members: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'members' })

  /**
   * Handle async operations with loading state
   * @param fn
   */
  const withAsync = async <T,>(fn: () => Promise<T>) => {
    try {
      setLoading(true)
      await fn()
    } finally {
      setLoading(false)
    }
  }

  /**
   * onSubmit form handler
   * @param values {z.infer<typeof CreateTreeSchema>}
   */
  const onSubmit = async (values: z.infer<typeof CreateTreeSchema>) =>
    withAsync(async () => {
      const { error, message, tree } = await createTree(values)
      if (error) return toast.error(t_errors(message || 'error'))

      toast.success(t_toasts('tree-created'))
      if (tree) resetTree(tree)
      setCanAccessMembers(true)
      setCurrentTab('members')
    })

  /**
   * Invite user to tree
   * @param email {string}
   * @param role {TreeAccessRole}
   */
  const inviteUser = (email: string, role: TreeAccessRole) =>
    withAsync(async () => {
      if (!currentTree) return
      const { error, message, tree } = await inviteMember(currentTree.id, email, role)
      if (error) return toast.error(t_errors(message || 'error'))
      toast.success(t_toasts('tree-member-added'))
      if (tree) resetTree(tree)
    })

  /**
   * Remove user from tree
   * @param index {number}
   * @param memberId {string}
   */
  const removeUser = (index: number, memberId?: string) =>
    withAsync(async () => {
      if (!memberId) return remove(index)
      if (!currentTree) return

      const { error, message, tree } = await removeMember(currentTree.id, memberId)
      if (error) return toast.error(t_errors(message || 'error'))
      toast.success(t_toasts('tree-member-removed'))
      if (tree) resetTree(tree)
    })

  /**
   * Reset the form and current tree state.
   * @param tree {Tree}
   */
  const resetTree = (tree: Tree) => {
    setCurrentTree(tree)
    form.reset({
      name: tree.name,
      type: tree.type,
      nodeImage: tree.nodeImage,
      nodeGallery: tree.nodeGallery,
      members: tree.accesses?.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        role: a.role,
      })),
    })
  }

  /**
   * Render member item
   * @param param0
   * @returns member field {JSX.Element}
   */
  const MemberItem = ({ field, index }: { field: (typeof fields)[0]; index: number }) => {
    const memberRole = form.watch(`members.${index}.role`)
    const memberEmail = form.watch(`members.${index}.email`)
    const canInvite = isValidEmail(memberEmail || '')
    const isNew = !field.userId

    return (
      <FormField
        key={field.id}
        control={form.control}
        name={`members.${index}.role`}
        render={() => (
          <FormItem className="bg-ocean-100/15 border-ocean-100/50 my-2 w-full flex-col items-center justify-start space-x-3 rounded border-2 p-4">
            <div className="w-full sm:flex sm:justify-between">
              <div className="flex-col space-y-2">
                {isNew ? (
                  <div className="flex w-full sm:space-x-5">
                    <Input
                      {...form.register(`members.${index}.email`)}
                      placeholder={t_trees('tree-member-email')}
                      className="w-full"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      disabled={!canInvite}
                      onClick={() => inviteUser(memberEmail!, memberRole!)}
                      className="bg-ocean-200 hover:bg-ocean-300 disabled:bg-ocean-100 hidden h-9 rounded px-2 py-1 text-xs font-bold text-white transition-colors duration-300 sm:block"
                    >
                      {t_trees('tree-member-invite')}
                    </button>
                  </div>
                ) : (
                  <FormLabel>
                    {field.name} <span className="font-normal">{`(${memberEmail})`}</span>
                  </FormLabel>
                )}
              </div>
              {currentUserId !== field.userId && (
                <button
                  type="button"
                  onClick={() => {
                    if (field.userId) {
                      setCurrMember({ index, memberId: field.userId })
                      setDialogOpen(true)
                    } else remove(index)
                  }}
                  className="bg-ocean-400 hover:bg-ocean-500 hidden h-8 rounded px-2 py-1 text-xs font-bold text-white transition-colors duration-300 sm:block"
                >
                  {t_trees('tree-member-remove')}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <FormControl>
                <StyledSelector
                  types={TreeAccessRole}
                  value={memberRole}
                  disabled={currentUserId === field.userId}
                  setValue={(value) => {
                    if (memberRole === 'ADMIN' && value !== 'ADMIN') {
                      const admins = form.getValues('members')?.filter((m) => m.role === 'ADMIN')
                      if (admins && admins.length <= 1)
                        return toast.error(t_errors('error-tree-admin-required'))
                    }
                    form.setValue(`members.${index}.role`, value)
                    fields[index].role = value
                  }}
                />
              </FormControl>
            </div>
            <div className="flex-col">
              {isNew && (
                <button
                  type="button"
                  disabled={memberEmail === ''}
                  onClick={() => inviteUser(memberEmail!, memberRole!)}
                  className="bg-ocean-200 hover:bg-ocean-300 visible h-9 w-full rounded px-2 py-1 text-xs font-bold text-white transition-colors duration-300 sm:hidden sm:w-auto"
                >
                  {t_trees('tree-member-invite')}
                </button>
              )}
              {currentUserId != field.userId && (
                <button
                  type="button"
                  onClick={() => {
                    if (field.userId) {
                      setCurrMember({ index, memberId: field.userId })
                      setDialogOpen(true)
                    } else {
                      remove(index)
                    }
                  }}
                  className="text-ocean-400 visible h-9 rounded px-2 py-1 text-xs font-bold underline decoration-dotted underline-offset-4 sm:hidden"
                >
                  {t_trees('tree-member-remove')}
                </button>
              )}
            </div>
          </FormItem>
        )}
      />
    )
  }

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col pt-2">
      <GoBack
        text={currentTree ? 'tree' : 'trees'}
        to={currentTree ? `/trees/${currentTree.slug}` : '/'}
      />
      <TypographyH4 className="mt-4">{t_trees('tree-create')}</TypographyH4>
      <p className="mb-4">{t_trees('tree-create-description')} </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={(e) => checkKeyDown(e)}>
          <Tabs.Root
            value={currentTab}
            onValueChange={(value) => setCurrentTab(value as 'general' | 'members')}
          >
            <Tabs.List className="border-ocean-200/50 mb-4 flex border-b-2">
              <Tabs.Trigger
                value="general"
                disabled={canAccessMembers}
                className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-bold"
              >
                {t_trees('general-tab-label')}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="members"
                disabled={!canAccessMembers}
                className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-bold"
              >
                {t_trees('tree-members-tab-label')}
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="general" className="space-y-4">
              <TypographyH5 className="mt-5">{t_trees('general-tab')}</TypographyH5>
              <div className="border-ocean-200/50 shadow-center-sm mb-2 flex-col items-start rounded-lg border-2 bg-white px-3 py-2 text-left">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="w-fit">
                      <FormLabel>{t_trees('tree-name')}</FormLabel>
                      <FormDescription className="mb-2 text-sm opacity-70">
                        {t_trees('tree-name-description')}
                      </FormDescription>
                      <FormControl className="mb-5 flex w-max">
                        <Input
                          {...field}
                          autoComplete="off"
                          className="w-auto"
                          placeholder={t_trees('name')}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                <FormField
                  control={form.control}
                  name="type"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t_trees('tree-types')}</FormLabel>
                      <FormDescription className="mb-2 text-sm opacity-70">
                        {t_trees('tree-types-info')}
                      </FormDescription>
                      <FormControl>
                        <StyledSelector
                          types={TreeType}
                          value={form.getValues('type')}
                          setValue={(value) => form.setValue('type', value as TreeType)}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="opacity-70">
                        {t_trees('tree-types-alert')}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              <TypographyH5 className="mt-5">{t_trees('settings-tab')}</TypographyH5>
              <div className="border-ocean-200/50 shadow-center flex-col items-start rounded border-2 bg-white px-3 py-2">
                <FormField
                  control={form.control}
                  name="compact"
                  render={() => {
                    const value = form.getValues('compact')
                    return (
                      <FormItem>
                        <FormLabel>{t_trees('tree-node-compact')}</FormLabel>
                        <FormDescription className="mb-2 text-sm opacity-70">
                          {t_trees('tree-node-compact-info')}
                        </FormDescription>
                        <FormControl>
                          <StyledSelector
                            types={['Compact', 'Loose'] as const}
                            value={form.getValues('compact') ? 'Compact' : 'Loose'}
                            setValue={(value) => form.setValue('compact', value === 'Compact')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                <FormField
                  control={form.control}
                  name="nodeImage"
                  render={() => {
                    const value = form.getValues('nodeImage')
                    return (
                      <FormItem>
                        <FormLabel>{t_trees('tree-node-image')}</FormLabel>
                        <FormDescription className="mb-2 text-sm opacity-70">
                          {t_trees('tree-node-image-info')}
                        </FormDescription>
                        <FormControl>
                          <StyledSelector
                            types={['Filled', 'Empty'] as const}
                            value={value == undefined ? '' : value ? 'Filled' : 'Empty'}
                            setValue={(value) => form.setValue('nodeImage', value === 'Filled')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                <FormField
                  control={form.control}
                  name="nodeGallery"
                  render={() => {
                    const value = form.getValues('nodeGallery')
                    return (
                      <FormItem>
                        <FormLabel>{t_trees('tree-node-gallery')}</FormLabel>
                        <FormDescription className="mb-2 text-sm opacity-70">
                          {t_trees('tree-node-gallery-info')}
                        </FormDescription>
                        <FormControl>
                          <StyledSelector
                            types={['Enabled', 'Disabled'] as const}
                            value={value == undefined ? '' : value ? 'Enabled' : 'Disabled'}
                            setValue={(value) => form.setValue('nodeGallery', value === 'Enabled')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>
              <div className="my-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-ocean-200 rounded p-2 px-5 text-white shadow"
                >
                  <div className="flex items-center space-x-3">
                    {loading && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-sm font-bold">
                      {loading ? t_common('creating') : t_common('create')}
                    </span>
                  </div>
                </button>
              </div>
            </Tabs.Content>
            <Tabs.Content value="members" className="space-y-4">
              <TypographyH5 className="mt-2">{t_trees('tree-members-tab')}</TypographyH5>
              <div className="border-ocean-200/50 shadow-center-sm flex-col items-start rounded-lg border-2 bg-white p-3">
                <FormLabel>{t_trees('tree-members')}</FormLabel>
                <FormDescription className="mb-2 text-sm opacity-70">
                  {t_trees('tree-members-info')}
                </FormDescription>
                <FormDescription className="my-4 text-sm opacity-70">
                  {t_trees('tree-member-role')}
                </FormDescription>
                {fields.map((field, index) => (
                  <MemberItem key={field.id} field={field} index={index} />
                ))}
              </div>
              <div className="my-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => append({ userId: '', name: '', email: '', role: 'VIEWER' })}
                  className="bg-ocean-200 hover:bg-ocean-300 rounded p-2 px-5 text-white shadow transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    {loading && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-sm font-bold">{t_trees('tree-member-add')}</span>
                  </div>
                </button>
              </div>
            </Tabs.Content>
          </Tabs.Root>
          <ConfirmDialog
            open={dialogOpen}
            title={t_trees('tree-member-remove-confirm')}
            description={t_trees('tree-member-remove-confirm-description')}
            onCancel={() => setDialogOpen(false)}
            onConfirm={() => {
              if (currMember) removeUser(currMember.index, currMember.memberId)
              setDialogOpen(false)
            }}
          />
        </form>
      </Form>
    </div>
  )
}
