'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'
import * as Tabs from '@radix-ui/react-tabs'

import { CreateFamilySchema, FamilyTypes } from '@/server/schemas'
import { updateFamily, inviteMember, updateMember, removeMember } from '@/server/actions'

import { GoBack } from '@/components/layout'
import { StyledSelector } from '@/components/families/form'
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
} from '@/ui'

import { Family, FamilyRoles } from '@/types'
import { checkKeyDown, isValidEmail } from '@/utils'

type FormValues = z.infer<typeof CreateFamilySchema>

interface MemberItemProps {
  field: any
  index: number
  form: UseFormReturn<FormValues>
  loading: boolean
  loadingUpdate: boolean
  currentUserId: string
  currentUserRole: FamilyRoles
  currentMemberRole: FamilyRoles
  inviteUser: (email: string, role: FamilyRoles) => void
  updateUser: (userId: string, role: FamilyRoles) => void
  setCurrMember: (value: { index: number; memberId?: string } | null) => void
  setDialogOpen: (open: boolean) => void
  remove: (index: number) => void
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
}: Omit<MemberItemProps, 'field'>) => {
  const t = useTranslations('FamiliesPage')
  const t_toasts = useTranslations('toasts')

  const memberRole = form.getValues(`members.${index}.role`)
  const memberEmail = form.getValues(`members.${index}.email`) || ''
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
        <FormItem className="bg-ocean-100/15 border-ocean-100/50 my-2 w-full flex-col items-center justify-start space-x-3 rounded border-2 p-4">
          <div className="w-full sm:flex sm:justify-between">
            <div className="flex-col space-y-2">
              {isNew ? (
                <div className="flex w-full sm:space-x-5">
                  <Input
                    {...form.register(`members.${index}.email`)}
                    placeholder={t('family-member-email')}
                    className="w-full"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    disabled={!canInvite}
                    onClick={() => inviteUser(memberEmail!, memberRole!)}
                    className="bg-ocean-200 hover:bg-ocean-300 disabled:bg-ocean-100 hidden h-9 w-64 rounded px-2 py-1 text-xs font-bold text-white transition-colors duration-300 sm:block"
                  >
                    {t('family-member-invite')}
                  </button>
                </div>
              ) : (
                <FormLabel>
                  {memberName} <span className="font-normal">{`(${memberEmail})`}</span>
                </FormLabel>
              )}
            </div>
            <div className="flex space-x-2">
              {!isNew && currentUserRole === 'ADMIN' && currentUserId !== memberId && (
                <button
                  type="button"
                  disabled={!canUpdate || loadingUpdate}
                  onClick={() => updateUser(memberId!, memberRole!)}
                  className="bg-ocean-300 disabled:bg-ocean-100 hover:bg-ocean-400 hidden h-8 rounded px-2 py-1 text-white transition-colors duration-300 sm:block"
                >
                  <div className="flex items-center justify-center space-x-3">
                    {loadingUpdate && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-center text-xs font-bold">
                      {loadingUpdate ? t('updating') : t('update')}
                    </span>
                  </div>
                </button>
              )}
              {currentUserRole === 'ADMIN' && currentUserId !== memberId && (
                <button
                  type="button"
                  onClick={() => {
                    if (memberId) (setCurrMember({ index, memberId }), setDialogOpen(true))
                    else remove(index)
                  }}
                  className="bg-ocean-500 hover:bg-ocean-600 hidden h-8 rounded px-2 py-1 text-xs font-bold text-white transition-colors duration-300 sm:block"
                >
                  {t('family-member-remove')}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FormControl>
              <StyledSelector
                types={FamilyRoles}
                value={memberRole}
                disabled={currentUserRole !== 'ADMIN' || currentUserId === memberId}
                setValue={(value) => {
                  if (memberRole === 'ADMIN' && value !== 'ADMIN') {
                    const admins = form.getValues('members')?.filter((m) => m.role === 'ADMIN')
                    if (admins && admins.length <= 1) {
                      toast.error(t_toasts('error-family-admin-required'))
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
              <button
                type="button"
                disabled={memberEmail === ''}
                onClick={() => inviteUser(memberEmail!, memberRole!)}
                className="bg-ocean-200 hover:bg-ocean-300 visible h-9 w-full rounded px-2 py-1 text-xs font-bold text-white transition-colors duration-300 sm:hidden sm:w-auto"
              >
                {t('family-member-invite')}
              </button>
            )}
            {!isNew && currentUserRole === 'ADMIN' && currentUserId != memberId && (
              <button
                type="button"
                disabled={!canUpdate || loadingUpdate}
                onClick={() => updateUser(memberId!, memberRole!)}
                className="bg-ocean-200 disabled:bg-ocean-100 hover:bg-ocean-300 visible h-9 w-full rounded px-2 py-1 text-white transition-colors duration-300 sm:hidden sm:w-auto"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loadingUpdate && <LoaderIcon size={16} className="animate-spin" />}
                  <span className="text-xs font-bold">
                    {loadingUpdate ? t('updating') : t('update')}
                  </span>
                </div>
              </button>
            )}
            {currentUserRole === 'ADMIN' && currentUserId != memberId && (
              <button
                type="button"
                onClick={() => {
                  if (memberId) {
                    setCurrMember({ index, memberId })
                    setDialogOpen(true)
                  } else {
                    remove(index)
                  }
                }}
                className="text-ocean-500 visible h-9 rounded px-2 py-1 text-xs font-bold underline sm:hidden"
              >
                {t('family-member-remove')}
              </button>
            )}
          </div>
        </FormItem>
      )}
    />
  )
}

interface EditFamilyProps {
  userId: string
  family: Family
}

export const EditFamily = ({ userId: currentUserId, family }: EditFamilyProps) => {
  const t = useTranslations('FamiliesPage')
  const t_toasts = useTranslations('toasts')

  const [loading, setLoading] = useState<boolean>(false)
  const [loadingUpdate, setLoadingUpdate] = useState<boolean>(false)

  const [currentFamily, setCurrentFamily] = useState<Family>(family)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [currMember, setCurrMember] = useState<{ index: number; memberId?: string } | null>(null)
  const currentUserRole = family.accesses?.find((a) => a.userId === currentUserId)?.role || 'VIEWER'

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateFamilySchema),
    defaultValues: {
      name: currentFamily.name,
      type: currentFamily.type as FamilyTypes,
      nodeImage: currentFamily.nodeImage,
      nodeGallery: currentFamily.nodeGallery,
      members: currentFamily.accesses?.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        role: a.role,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'members' })

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
   * @param values {z.infer<typeof CreateFamilySchema>}
   */
  const onSubmit = async (values: z.infer<typeof CreateFamilySchema>) =>
    withAsync(async () => {
      const { error, message, family } = await updateFamily(currentFamily.id, currentUserId, values)
      if (error) return toast.error(t_toasts(message || 'error'))

      toast.success(t_toasts('family-updated'))
      if (family) resetFamily(family)
    })

  /**
   * Invite user to family
   * @param email {string}
   * @param role {FamilyRoles}
   */
  const inviteUser = (email: string, role: FamilyRoles) =>
    withAsync(async () => {
      if (!currentFamily) return
      const { error, message, family } = await inviteMember(currentFamily.id, email, role)
      if (error) return toast.error(t_toasts(message || 'error'))
      toast.success(t_toasts('family-member-added'))
      if (family) resetFamily(family)
    })

  /**
   * Update user role
   * @param memberId {string}
   * @param role  {FamilyRoles}
   */
  const updateUser = (memberId: string, role: FamilyRoles) =>
    withAsync(async () => {
      if (!currentFamily) return
      const { error, message, family } = await updateMember(currentFamily.id, memberId, role)
      if (error) return toast.error(t_toasts(message || 'error'))
      toast.success(t_toasts('family-member-updated'))
      if (family) resetFamily(family)
    }, true)

  /**
   * Remove user from family
   * @param index {number}
   * @param memberId {string}
   */
  const removeUser = (index: number, memberId?: string) =>
    withAsync(async () => {
      if (!memberId) return remove(index)
      if (!currentFamily) return

      const { error, message, family } = await removeMember(currentFamily.id, memberId)
      if (error) return toast.error(t_toasts(message || 'error'))
      toast.success(t_toasts('family-member-removed'))
      if (family) resetFamily(family)
    })

  /**
   * Reset the form and current family state.
   * @param family {Family}
   */
  const resetFamily = (family: Family) => {
    setCurrentFamily(family)
    form.reset({
      name: family.name,
      type: family.type,
      nodeImage: family.nodeImage,
      nodeGallery: family.nodeGallery,
      members: family.accesses?.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        role: a.role,
      })),
    })
  }

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col pt-2">
      <GoBack to={`/families/${currentFamily.slug}`} />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={(e) => checkKeyDown(e)}
          className="mt-2 w-full"
        >
          <Tabs.Root defaultValue="general" className="mt-2 w-full">
            <Tabs.List className="border-ocean-200/50 mb-4 flex border-b-2">
              <Tabs.Trigger
                value="general"
                className="data-[state=active]:border-ocean-200 data-[state=active]:text-ocean-400 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors data-[state=active]:border-b-2"
              >
                {t('general-tab-label')}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="settings"
                className="data-[state=active]:border-ocean-200 data-[state=active]:text-ocean-400 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors data-[state=active]:border-b-2"
              >
                {t('settings-tab-label')}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="members"
                className="data-[state=active]:border-ocean-200 data-[state=active]:text-ocean-400 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors data-[state=active]:border-b-2"
              >
                {t('family-members-tab-label')}
              </Tabs.Trigger>
            </Tabs.List>
            {/* --- GENERAL TAB --- */}
            <Tabs.Content value="general" className="space-y-4">
              <TypographyH5 className="mt-2">{t('general-tab')}</TypographyH5>
              <div className="border-ocean-200/50 mb-2 flex-col items-start rounded border-2 bg-white p-3 text-left shadow-lg">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel>{t('family-name')}</FormLabel>
                      <FormControl>
                        <div className="flex w-max py-2">
                          <Input
                            {...field}
                            placeholder={t('name')}
                            className="w-full"
                            disabled={loading}
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
                  name="type"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t('family-types')}</FormLabel>
                      <FormDescription className="mb-2 text-sm opacity-70">
                        {t('family-types-info')}
                      </FormDescription>
                      <FormControl>
                        <StyledSelector
                          types={FamilyTypes}
                          value={form.getValues('type')}
                          setValue={(value) => form.setValue('type', value as FamilyTypes)}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="opacity-70">
                        {t('family-types-alert')}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              <div className="my-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-ocean-200 hover:bg-ocean-300 rounded p-2 px-5 text-white shadow transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    {loading && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-sm font-bold">
                      {loading ? t('updating-family') : t('update')}
                    </span>
                  </div>
                </button>
              </div>
            </Tabs.Content>
            {/* --- SETTINGS TAB --- */}
            <Tabs.Content value="settings" className="space-y-4">
              <TypographyH5 className="mt-2">{t('settings-tab')}</TypographyH5>
              <div className="border-ocean-200/50 flex-col items-start rounded border-2 bg-white p-3 shadow-lg">
                <FormField
                  control={form.control}
                  name="nodeImage"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t('family-node-image')}</FormLabel>
                      <FormDescription className="mb-2 text-sm opacity-70">
                        {t('family-node-image-info')}
                      </FormDescription>
                      <FormControl>
                        <StyledSelector
                          types={['Filled', 'Empty'] as const}
                          value={form.getValues('nodeImage') ? 'Filled' : 'Empty'}
                          setValue={(value) => form.setValue('nodeImage', value === 'Filled')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                <FormField
                  control={form.control}
                  name="nodeGallery"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t('family-node-gallery')}</FormLabel>
                      <FormDescription className="mb-2 text-sm opacity-70">
                        {t('family-node-gallery-info')}
                      </FormDescription>
                      <FormControl>
                        <StyledSelector
                          types={['Enabled', 'Disabled'] as const}
                          value={form.getValues('nodeGallery') ? 'Enabled' : 'Disabled'}
                          setValue={(value) => form.setValue('nodeGallery', value === 'Enabled')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="my-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-ocean-200 hover:bg-ocean-300 rounded p-2 px-5 text-white shadow transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    {loading && <LoaderIcon size={16} className="animate-spin" />}
                    <span className="text-sm font-bold">
                      {loading ? t('updating-family') : t('update')}
                    </span>
                  </div>
                </button>
              </div>
            </Tabs.Content>
            {/* --- MEMBERS TAB --- */}
            <Tabs.Content value="members" className="space-y-4">
              <TypographyH5 className="mt-2">{t('family-members-tab')}</TypographyH5>
              <div className="border-ocean-200/50 flex-col items-start rounded border-2 bg-white p-3 shadow-lg">
                <FormLabel>{t('family-members')}</FormLabel>
                <FormDescription className="mb-2 text-sm opacity-70">
                  {t('family-members-info')}
                </FormDescription>
                <FormDescription className="my-4 text-sm opacity-70">
                  {t('family-member-role')}
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
                  />
                ))}
              </div>
              {currentUserRole === 'ADMIN' && (
                <div className="my-5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => append({ userId: '', name: '', email: '', role: 'VIEWER' })}
                    className="bg-ocean-200 hover:bg-ocean-300 rounded p-2 px-5 text-white shadow transition-colors duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      {loading && <LoaderIcon size={16} className="animate-spin" />}
                      <span className="text-sm font-bold">{t('family-member-add')}</span>
                    </div>
                  </button>
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>

          <ConfirmDialog
            open={dialogOpen}
            title={t('family-member-remove-confirm')}
            description={t('family-member-remove-confirm-description')}
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
