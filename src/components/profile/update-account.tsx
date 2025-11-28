'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { LoaderIcon, LogOut, SaveIcon } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'
import * as Tabs from '@radix-ui/react-tabs'

import { updateProfile } from '@/server/actions'
import { UpdateProfileSchema } from '@/server/schemas'

import {
  Button,
  Input,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  TypographyH5,
} from '@/ui'

import { DeleteAccount } from './delete-account'
import { LogoutAccount } from './logout-account'
import { StyledSelector } from '../trees/form'

interface UpdateAccountProps {
  id: string
  name: string
  email: string
  isPrivate: boolean
}

export const UpdateAccount = (props: UpdateAccountProps) => {
  const t_common = useTranslations('common')
  const t_profile = useTranslations('profile')
  const t_toasts = useTranslations('toasts')
  const t_errors = useTranslations('errors')

  const [loading, setLoading] = useState<boolean>(false)
  const [currentTab, setCurrentTab] = useState<'profile' | 'account'>('profile')

  const hookForm = useForm<z.infer<typeof UpdateProfileSchema>>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: props.name,
      email: props.email,
      isPrivate: props.isPrivate,
    },
  })

  const name = hookForm.watch('name')
  const isPrivate = hookForm.watch('isPrivate')

  /**
   * Handle form submission to update profile.
   * @param values {z.infer<typeof UpdateProfileSchema>}
   */
  const onSubmit = async (values: z.infer<typeof UpdateProfileSchema>) => {
    try {
      setLoading(true)
      await updateProfile(values)
      toast.success(t_toasts('profile-updated'))
    } catch (error) {
      toast.error(t_errors('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-ocean-400 z-0 flex w-full flex-col">
      <Form {...hookForm}>
        <form onSubmit={hookForm.handleSubmit(onSubmit)}>
          <Tabs.Root
            value={currentTab}
            onValueChange={(value) => setCurrentTab(value as 'profile' | 'account')}
          >
            <Tabs.List className="border-ocean-200/50 mb-4 flex border-b-2">
              <Tabs.Trigger
                value="profile"
                className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-black"
              >
                {t_profile('profile-tab-label')}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="account"
                className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-black"
              >
                {t_profile('account-tab-label')}
              </Tabs.Trigger>
            </Tabs.List>
            {/* --- PROFILE TAB --- */}
            <Tabs.Content value="profile">
              <TypographyH5 className="mt-2">{t_profile('profile-tab')}</TypographyH5>
              <div className="border-ocean-200/50 mb-2 flex-col items-start rounded border-2 bg-white p-3 text-left shadow-lg">
                <FormField
                  control={hookForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="w-fit">
                      <FormLabel className="font-bold">{t_profile('name')}</FormLabel>
                      <FormDescription className="text-sm opacity-70">
                        {t_profile('name-description')}
                      </FormDescription>
                      <FormControl className="mb-5 flex w-max">
                        <Input
                          className="w-auto"
                          placeholder={t_profile('name')}
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                <FormField
                  control={hookForm.control}
                  name="isPrivate"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t_profile('private')}</FormLabel>
                      <FormDescription className="mb-2 text-sm opacity-70">
                        {t_profile('private-description')}
                      </FormDescription>
                      <FormControl>
                        <StyledSelector
                          types={['Public', 'Private'] as const}
                          value={hookForm.getValues('isPrivate') ? 'Private' : 'Public'}
                          setValue={(value) => hookForm.setValue('isPrivate', value === 'Private')}
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
                  disabled={loading || (name === props.name && isPrivate === props.isPrivate)}
                >
                  {loading ? (
                    <LoaderIcon size={16} className="animate-spin" />
                  ) : (
                    <SaveIcon size={16} />
                  )}
                  <span className="font-bold">
                    {loading ? t_common('saving') : t_common('save')}
                  </span>
                </Button>
              </div>
            </Tabs.Content>
            {/* --- ACCOUNT TAB --- */}
            <Tabs.Content value="account">
              <TypographyH5 className="mt-2">{t_profile('account-tab')}</TypographyH5>
              <div className="border-ocean-200/50 mb-2 flex flex-col items-start rounded border-2 bg-white p-3 text-left shadow-lg">
                <FormField
                  name="email"
                  render={({ field }) => (
                    <FormItem className="w-fit">
                      <FormLabel className="font-bold">{t_profile('email')}</FormLabel>
                      <FormDescription className="text-sm opacity-70">
                        {t_profile('email-description')}
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder={t_profile('email')}
                          {...field}
                          disabled
                          className="w-auto"
                        />
                      </FormControl>
                      <FormDescription className="text-xs opacity-70">
                        <span>{t_profile('email-hint')}</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                <div className="flex w-full justify-between">
                  <LogoutAccount
                    trigger={
                      <Button variant="ghost">
                        <LogOut size={16} color="#3D6C5F" />
                        <span className="font-bold">{t_profile('account-logout')}</span>
                      </Button>
                    }
                  />
                  <DeleteAccount
                    email={props.email!}
                    trigger={<Button variant="ghost">{t_profile('account-delete')}</Button>}
                  />
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </form>
      </Form>
    </div>
  )
}
