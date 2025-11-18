'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { LoaderIcon, LogOut, SaveIcon } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'

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
} from '@/ui'

import { CardAccount } from './card-account'
import { DeleteAccount } from './delete-account'
import { LogoutAccount } from './logout-account'

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

  const hookForm = useForm<z.infer<typeof UpdateProfileSchema>>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: props.name,
      email: props.email,
      isPrivate: props.isPrivate,
    },
  })

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
    <CardAccount title={t_profile('title')} description={t_profile('description')} action>
      <Form {...hookForm}>
        <form onSubmit={hookForm.handleSubmit(onSubmit)} className="text-ocean-400 mb-5 space-y-5">
          <FormField
            control={hookForm.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="font-semibold">{t_profile('private')}</FormLabel>
                <FormDescription className="mb-5 text-sm opacity-70">
                  {t_profile('private-description')}
                </FormDescription>
                <FormControl className="space-y-2">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="sr-only"
                      disabled={loading}
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span
                      className={`h-6 w-11 rounded-full transition-colors ${
                        field.value ? 'bg-ocean-400' : 'bg-ocean-200/50'
                      }`}
                    />
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                        field.value ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={hookForm.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-fit">
                <FormLabel className="font-semibold">{t_profile('name')}</FormLabel>
                <FormControl>
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
          <FormField
            control={hookForm.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-fit">
                <FormLabel className="font-semibold">{t_profile('email')}</FormLabel>
                <FormControl>
                  <Input placeholder={t_profile('email')} {...field} disabled className="w-auto" />
                </FormControl>
                <FormDescription className="text-ocean-400 flex items-center gap-2 pl-1">
                  <span>{t_profile('email-hint')}</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DeleteAccount
            email={props.email!}
            trigger={
              <Button variant="destructive">
                <span className="font-semibold">{t_profile('account-delete')}</span>
              </Button>
            }
          />
          <div className="flex items-center">
            <Button
              type="submit"
              disabled={
                loading ||
                (hookForm.getValues().name === props.name &&
                  hookForm.getValues().isPrivate === props.isPrivate)
              }
            >
              {loading ? <LoaderIcon size={16} className="animate-spin" /> : <SaveIcon size={16} />}
              <span className="font-semibold">
                {loading ? t_common('saving') : t_common('save')}
              </span>
            </Button>
          </div>
        </form>
      </Form>
      <LogoutAccount
        trigger={
          <Button variant="outline" className="mt-10 w-fit">
            <LogOut size={16} color="#3D6C5F" />
            <span className="text-ocean-400 font-semibold">{t_profile('account-logout')}</span>
          </Button>
        }
      />
    </CardAccount>
  )
}
