'use client'

import { useState, type ReactNode } from 'react'
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

  /**
   * Handle account logout.
   */
  async function handleLogoutAccount() {
    setLoading(true)
    toast.promise(handleSignOut, {
      loading: t_profile('account-logout-logging-out'),
      error: t_profile('account-logout-logged-out'),
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
            <Button variant="ghost" disabled={loading} className="font-bold">
              {t_common('cancel')}
            </Button>
          </DialogClose>
          <Button disabled={loading} onClick={handleLogoutAccount}>
            {loading ?? <LoaderIcon size={16} className="animate-spin" />}
            <span>{t_profile('account-logout')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
