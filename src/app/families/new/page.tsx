'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'

import { CreateFamilySchema, FamilyTypes } from '@/server/schemas'
import { createFamily } from '@/server/actions'
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
  TypographyH5,
} from '@/ui'

export default function NewFamilyPage() {
  const t = useTranslations('FamiliesPage')
  const t_toasts = useTranslations('toasts')
  const router = useRouter()

  const [loading, setLoading] = useState<boolean>(false)

  const form = useForm<z.infer<typeof CreateFamilySchema>>({
    resolver: zodResolver(CreateFamilySchema),
    defaultValues: { name: '' },
  })

  /**
   * onSubmit form handler
   * @param values
   */
  const onSubmit = async (values: z.infer<typeof CreateFamilySchema>) => {
    try {
      setLoading(true)
      const { error, message } = await createFamily(values)
      if (error) {
        toast.error(t_toasts(message || 'error'))
        return
      }

      toast.success(t_toasts('family-created'))
      form.reset()
      router.replace('/')
    } catch (error) {
      toast.error(t_toasts('error'))
    } finally {
      setLoading(false)
    }
  }

  function checkKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter') event.preventDefault()
  }

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col pt-2">
      <GoBack text={'families'} />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={(e) => checkKeyDown(e)}
          className="w-full"
        >
          <TypographyH5 className="mt-5">{t('general-tab-label')}</TypographyH5>
          <div className="border-ocean-200/50 mb-2 flex-col items-start rounded border-2 bg-white px-3 py-2 text-left shadow-lg">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>{t('family-name')}</FormLabel>
                  <FormControl>
                    <div className="py-2">
                      <Input
                        {...field}
                        autoComplete="off"
                        className="focus-visible:ring-none border-0 shadow-none ring-0 outline-none focus-visible:ring-0 focus-visible:outline-none"
                        placeholder={t('name')}
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-2/4" />
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
          <TypographyH5 className="mt-5">{t('settings-tab-label')}</TypographyH5>
          <div className='border-ocean-200/50 shadow-lg" flex-col items-start rounded border-2 bg-white px-3 py-2'>
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
            <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-2/4" />
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
          <div className="mt-5 flex w-full justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-ocean-200 rounded p-2 px-5 text-white shadow"
            >
              <div className="flex items-center space-x-3">
                {loading && <LoaderIcon size={16} className="animate-spin" />}
                <span className="text-sm font-bold">{loading ? t('creating') : t('create')}</span>
              </div>
            </button>
          </div>
        </form>
      </Form>
    </div>
  )
}
