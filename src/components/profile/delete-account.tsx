'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'

import { deleteProfile } from '@/server/actions'

import {
  Input,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from '@/ui'

interface DeleteAccountProps {
  trigger: ReactNode
  email: string
}

export const DeleteAccount = (props: DeleteAccountProps) => {
  const t_common = useTranslations('common')
  const t_profile = useTranslations('profile')

  const [confirmEmail, setConfirmEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  /**
   * Handle account deletion.
   * @param e React.FormEvent<HTMLFormElement>
   */
  const handleDeleteAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (confirmEmail !== props.email) {
      toast.error(t_profile('email-unmatched'))
      return
    }
    setLoading(true)
    toast.promise(deleteProfile, {
      loading: t_common('deleting'),
      description: t_profile('account-deleting'),
      success: () => {
        setLoading(false)
        return t_profile('account-deleted')
      },
      error: t_profile('account-delete-error'),
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t_profile('account-delete')}</DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-red-500">
              {t_profile('account-delete-attention')}
            </span>{' '}
            {t_profile('account-delete-text')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDeleteAccount}>
          <div className="flex flex-col space-y-3">
            <p className="text-sm">
              {t_profile('account-delete-prompt')}{' '}
              <span className="font-semibold">{props.email}</span>
            </p>
            <Input
              type="email"
              className="input"
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={t_profile('email')}
              disabled={loading}
            />
            <DialogFooter className="mt-3">
              <DialogClose asChild>
                <Button variant="ghost" disabled={loading} className="font-bold">
                  {t_common('cancel')}
                </Button>
              </DialogClose>
              <Button
                disabled={loading || confirmEmail !== props.email}
                type="submit"
                variant="destructive"
              >
                {loading ?? <LoaderIcon size={16} className="animate-spin" />}
                <span>{loading ? t_common('deleting') : t_common('delete')}</span>
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
