'use client'

import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'

import { isTreeDetailRoute } from '@/utils'

const TREE_VIEW_TOAST_OFFSET = 'calc(env(safe-area-inset-bottom) + 7rem)'

/**
 * Toaster Provider component.
 * @returns JSX.Element
 */
export const ToasterProvider = () => {
  const pathname = usePathname()
  const toastOffset = pathname && isTreeDetailRoute(pathname) ? { bottom: TREE_VIEW_TOAST_OFFSET } : undefined

  return (
    <Toaster
      offset={toastOffset}
      position="bottom-center"
      theme={'light'}
      toastOptions={{
        classNames: {
          title: 'font-sans! font-bold! text-pale-ocean!',
          toast: 'bg-ocean-200/80! border-ocean-200! border-2! text-pale-ocean!',
          icon: 'text-pale-ocean! ',
        },
      }}
    />
  )
}
