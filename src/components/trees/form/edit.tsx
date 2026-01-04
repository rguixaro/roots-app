'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'
import * as Tabs from '@radix-ui/react-tabs'

import { CreateTreeSchema, TreeType } from '@/server/schemas'
import { updateTree, inviteMember, updateMember, removeMember } from '@/server/actions'

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
  Button,
} from '@/ui'

import { Tree, TreeAccessRole } from '@/types'
import { checkKeyDown, isValidEmail } from '@/utils'

type FormValues = z.infer<typeof CreateTreeSchema>

interface MemberItemProps {
  field: any
  index: number
  form: UseFormReturn<FormValues>
  loading: boolean
  loadingUpdate: boolean
  currentUserId: string
  currentUserRole: TreeAccessRole
  currentMemberRole: TreeAccessRole
  inviteUser: (email: string, role: TreeAccessRole) => void
  updateUser: (userId: string, role: TreeAccessRole) => void
  setCurrMember: (value: { index: number; memberId?: string } | null) => void
  setDialogOpen: (open: boolean) => void
  remove: (index: number) => void
  t_trees: any
  t_common: any
  t_errors: any
}

/**
 * Render member item
 * @param param0
 * @returns member field {JSX.Element}
 */
const MemberItem = ({
  index,
  form,
  loading,
  loadingUpdate,
  currentUserId,
  currentUserRole,
  currentMemberRole,
  inviteUser,
  updateUser,
  setCurrMember,
  setDialogOpen,
  remove,
  t_trees,
  t_common,
  t_errors,
}: Omit<MemberItemProps, 'field'>) => {
  const memberRole = form.watch(`members.${index}.role`)
  const memberEmail = form.watch(`members.${index}.email`) || ''
  const memberName = form.watch(`members.${index}.name`) || ''
  const memberId = form.watch(`members.${index}.userId`) || ''

  const canInvite = isValidEmail(memberEmail)
  const canUpdate = memberRole !== currentMemberRole
  const isNew = !memberId

  return (
    <FormField
      control={form.control}
      name={`members.${index}.role`}
      render={() => (
        <FormItem className="bg-ocean-100/15 border-ocean-100/50 my-2 w-full flex-col items-center justify-start space-x-3 rounded-lg border-2 p-4">
          <div className="w-full sm:flex sm:justify-between">
            <div className="flex-col space-y-2">
              {isNew ? (
                <Input
                  {...form.register(`members.${index}.email`)}
                  placeholder={t_trees('tree-member-email')}
                  className="w-full"
                  disabled={loading}
                />
              ) : (
                <FormLabel>
                  {memberName} <span className="font-normal">{`(${memberEmail})`}</span>
                </FormLabel>
              )}
            </div>
            <div className="flex space-x-2">
              {isNew && (
                <Button
                  type="button"
                  variant={'outline'}
                  disabled={!canInvite}
                  onClick={() => inviteUser(memberEmail!, memberRole!)}
                  className="bg-ocean-50 border-ocean-200 text-ocean-200 hover:bg-ocean-200 hover:text-pale-ocean disabled:bg-ocean-50 hidden text-xs font-bold sm:block"
                >
                  {t_trees('tree-member-invite')}
                </Button>
              )}
              {!isNew && currentUserRole === 'ADMIN' && currentUserId !== memberId && (
                <Button
                  type="button"
                  variant={'outline'}
                  disabled={!canUpdate || loadingUpdate}
                  onClick={() => updateUser(memberId!, memberRole!)}
                  className="bg-ocean-50 border-ocean-200 text-ocean-200 hover:bg-ocean-200 hover:text-pale-ocean disabled:bg-ocean-50 hidden text-xs font-bold sm:block"
                >
                  <div className="flex items-center justify-center space-x-3">
                    {loadingUpdate && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-center text-xs font-bold">
                      {loadingUpdate ? t_common('updating') : t_common('update')}
                    </span>
                  </div>
                </Button>
              )}
              {currentUserRole === 'ADMIN' && currentUserId !== memberId && (
                <Button
                  type="button"
                  onClick={() => {
                    if (memberId) (setCurrMember({ index, memberId }), setDialogOpen(true))
                    else remove(index)
                  }}
                  className="bg-ocean-300 hover:bg-ocean-400 text-pale-ocean hidden text-xs font-bold sm:block"
                >
                  {t_trees('tree-member-remove')}
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FormControl>
              <StyledSelector
                types={TreeAccessRole}
                value={memberRole}
                disabled={currentUserRole !== 'ADMIN' || currentUserId === memberId}
                setValue={(value) => {
                  if (memberRole === 'ADMIN' && value !== 'ADMIN') {
                    const admins = form.getValues('members')?.filter((m) => m.role === 'ADMIN')
                    if (admins && admins.length <= 1) {
                      toast.error(t_errors('error-tree-admin-required'))
                      return
                    }
                  }
                  form.setValue(`members.${index}.role`, value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
              />
            </FormControl>
          </div>
          <div className="flex-col">
            {isNew && (
              <Button
                type="button"
                variant={'outline'}
                disabled={!canInvite}
                onClick={() => inviteUser(memberEmail!, memberRole!)}
                className="bg-ocean-50 border-ocean-200 text-ocean-200 hover:bg-ocean-200 hover:text-pale-ocean disabled:bg-ocean-50 visible w-full text-xs font-bold sm:hidden sm:w-auto"
              >
                {t_trees('tree-member-invite')}
              </Button>
            )}
            {!isNew && currentUserRole === 'ADMIN' && currentUserId != memberId && (
              <Button
                type="button"
                variant={'outline'}
                disabled={!canUpdate || loadingUpdate}
                onClick={() => updateUser(memberId!, memberRole!)}
                className="bg-ocean-50 border-ocean-200 text-ocean-200 hover:bg-ocean-200 hover:text-pale-ocean disabled:bg-ocean-50 visible w-full text-xs font-bold sm:hidden sm:w-auto"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loadingUpdate && <LoaderIcon size={16} className="animate-spin" />}
                  <span className="text-xs font-bold">
                    {loadingUpdate ? t_common('updating') : t_common('update')}
                  </span>
                </div>
              </Button>
            )}
            {currentUserRole === 'ADMIN' && currentUserId != memberId && (
              <Button
                type="button"
                onClick={() => {
                  if (memberId) {
                    setCurrMember({ index, memberId })
                    setDialogOpen(true)
                  } else {
                    remove(index)
                  }
                }}
                className="text-ocean-400 visible bg-transparent text-xs font-bold underline decoration-dotted underline-offset-4 shadow-none! sm:hidden"
              >
                {t_trees('tree-member-remove')}
              </Button>
            )}
          </div>
        </FormItem>
      )}
    />
  )
}

interface EditTreeProps {
  userId: string
  tree: Tree
}

export const EditTree = ({ userId: currentUserId, tree }: EditTreeProps) => {
  const t_trees = useTranslations('trees')
  const t_common = useTranslations('common')
  const t_errors = useTranslations('errors')
  const t_toasts = useTranslations('toasts')

  const [loading, setLoading] = useState<boolean>(false)
  const [loadingUpdate, setLoadingUpdate] = useState<boolean>(false)

  const [currentTree, setCurrentTree] = useState<Tree>(tree)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [currMember, setCurrMember] = useState<{ index: number; memberId?: string } | null>(null)
  const currentUserRole = tree.accesses?.find((a) => a.userId === currentUserId)?.role || 'VIEWER'

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateTreeSchema),
    defaultValues: {
      name: currentTree.name,
      type: currentTree.type as TreeType,
      newsletter: currentTree.newsletter,
      members: currentTree.accesses?.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        role: a.role,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'members' })

  const treeName = form.watch('name')
  const newsletter = form.watch('newsletter')

  /**
   * Handle async operations with loading state
   * @param fn
   */
  const withAsync = async <T,>(fn: () => Promise<T>, isUpdate?: boolean) => {
    try {
      if (isUpdate) setLoadingUpdate(true)
      else setLoading(true)
      await fn()
    } finally {
      if (isUpdate) setLoadingUpdate(false)
      else setLoading(false)
    }
  }

  /**
   * onSubmit form handler
   * @param values {z.infer<typeof CreateTreeSchema>}
   */
  const onSubmit = async (values: z.infer<typeof CreateTreeSchema>) =>
    withAsync(async () => {
      const { error, message, tree } = await updateTree(currentTree.id, values)
      if (error) return toast.error(t_errors(message || 'error'))

      toast.success(t_toasts('tree-updated'))
      if (tree) resetTree(tree)
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
   * Update user role
   * @param memberId {string}
   * @param role  {TreeAccessRole}
   */
  const updateUser = (memberId: string, role: TreeAccessRole) =>
    withAsync(async () => {
      if (!currentTree) return
      const { error, message, tree } = await updateMember(currentTree.id, memberId, role)
      if (error) return toast.error(t_errors(message || 'error'))
      toast.success(t_toasts('tree-member-updated'))
      if (tree) resetTree(tree)
    }, true)

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
      newsletter: tree.newsletter,
      members: tree.accesses?.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        role: a.role,
      })),
    })
  }

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col pt-2">
      <GoBack to={`/trees/${currentTree.slug}`} />
      <TypographyH4 className="mt-4">{t_trees('tree-edit')}</TypographyH4>
      <p className="mb-4">{t_trees('tree-edit-description')} </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={(e) => checkKeyDown(e)}>
          <Tabs.Root defaultValue="general">
            <Tabs.List className="border-ocean-200/50 mb-4 flex border-b-2">
              <Tabs.Trigger
                value="general"
                className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors data-[state=active]:border-b-2 data-[state=active]:font-bold"
              >
                {t_trees('general-tab-label')}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="settings"
                className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors data-[state=active]:border-b-2 data-[state=active]:font-bold"
              >
                {t_trees('settings-tab-label')}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="members"
                className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors data-[state=active]:border-b-2 data-[state=active]:font-bold"
              >
                {t_trees('tree-members-tab-label')}
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="general" className="space-y-4">
              <TypographyH5 className="mt-2">{t_trees('general-tab')}</TypographyH5>
              <div className="border-ocean-200/50 shadow-center-sm mb-2 flex-col items-start rounded-lg border-2 bg-white p-3 text-left">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t_trees('tree-name')}</FormLabel>
                      <FormDescription className="text-sm opacity-70">
                        {t_trees('tree-name-description')}
                      </FormDescription>
                      <FormControl className="mb-5 flex w-max">
                        <Input
                          {...field}
                          placeholder={t_trees('name')}
                          className="w-auto"
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
                      <FormDescription className="text-sm opacity-70">
                        {t_trees('tree-types-info')}
                      </FormDescription>
                      <FormControl>
                        <StyledSelector
                          types={TreeType}
                          value={form.getValues('type')}
                          setValue={(value) => form.setValue('type', value as TreeType)}
                          disabled
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
              <div className="my-5">
                <Button
                  type="submit"
                  disabled={loading || treeName === currentTree.name}
                  className="hover:bg-ocean-300 text-pale-ocean"
                >
                  <div className="flex items-center space-x-3">
                    {loading && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-sm font-bold">
                      {loading ? t_common('updating') : t_common('update')}
                    </span>
                  </div>
                </Button>
              </div>
            </Tabs.Content>
            <Tabs.Content value="settings" className="space-y-4">
              <TypographyH5 className="mt-2">{t_trees('settings-tab')}</TypographyH5>
              <div className="border-ocean-200/50 shadow-center-sm flex-col items-start rounded-lg border-2 bg-white p-3">
                <FormField
                  control={form.control}
                  name="newsletter"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t_trees('tree-newsletter-weekly')}</FormLabel>
                      <FormDescription className="mb-2 text-sm opacity-70">
                        {t_trees('tree-newsletter-weekly-info')}
                      </FormDescription>
                      <FormControl>
                        <StyledSelector
                          types={['Enabled', 'Disabled'] as const}
                          value={form.getValues('newsletter') ? 'Enabled' : 'Disabled'}
                          setValue={(value) => form.setValue('newsletter', value === 'Enabled')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="my-5">
                <Button
                  type="submit"
                  disabled={loading || newsletter === currentTree.newsletter}
                  className="hover:bg-ocean-300 text-pale-ocean"
                >
                  <div className="flex items-center space-x-3">
                    {loading && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-sm font-bold">
                      {loading ? t_common('updating') : t_common('update')}
                    </span>
                  </div>
                </Button>
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
                  <MemberItem
                    key={field.id}
                    index={index}
                    form={form}
                    loading={loading}
                    loadingUpdate={loadingUpdate}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    currentMemberRole={field.role}
                    inviteUser={inviteUser}
                    updateUser={updateUser}
                    setCurrMember={setCurrMember}
                    setDialogOpen={setDialogOpen}
                    remove={remove}
                    t_trees={t_trees}
                    t_common={t_common}
                    t_errors={t_errors}
                  />
                ))}
              </div>
              {currentUserRole === 'ADMIN' && (
                <div className="my-5">
                  <Button
                    type="button"
                    disabled={loading}
                    className="hover:bg-ocean-300 text-pale-ocean"
                    onClick={() =>
                      append({
                        userId: '',
                        name: '',
                        email: '',
                        role: 'VIEWER',
                      })
                    }
                  >
                    <div className="flex items-center space-x-3">
                      {loading && <LoaderIcon size={16} className="animate-spin" />}
                      <span className="text-sm font-bold">{t_trees('tree-member-add')}</span>
                    </div>
                  </Button>
                </div>
              )}
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
