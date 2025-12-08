'use client'

import { Toaster } from 'sonner'

/**
 * Toaster Provider component.
 * @returns JSX.Element
 */
export const ToasterProvider = () => (
  <Toaster
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
