'use client'

import { useState, type ReactNode, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { DialogClose } from '@radix-ui/react-dialog'
import { LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'

import { handleSignOut } from '@/server/actions'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  DialogFooter,
} from '@/ui'

interface LogoutAccountProps {
  trigger: ReactNode
}

export const LogoutAccount = (props: LogoutAccountProps) => {
  const t_common = useTranslations('common')
  const t_profile = useTranslations('profile')

  const [loading, setLoading] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()

  /**
   * Handle account logout using a server action
   */
  const handleLogoutAccount = () => {
    setLoading(true)

    startTransition(() => {
      const promise = toast.promise(
        (async () => {
          await fetch('/api/logout', { method: 'POST', credentials: 'include' })
          await handleSignOut()
        })(),
        {
          loading: t_profile('account-logout-logging-out'),
          success: t_profile('account-logout-logged-out'),
          error: t_profile('account-logout-error'),
        }
      )
      promise.unwrap().finally(() => setLoading(false))
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t_profile('account-logout') + '?'}</DialogTitle>
          <DialogDescription>{t_profile('account-logout-text')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3">
          <DialogClose asChild>
            <Button variant="ghost" disabled={loading || isPending} className="font-bold">
              {t_common('cancel')}
            </Button>
          </DialogClose>
          <Button disabled={loading || isPending} onClick={handleLogoutAccount}>
            {(loading || isPending) && <LoaderIcon size={16} className="mr-2 animate-spin" />}
            <span>{t_profile('account-logout')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
