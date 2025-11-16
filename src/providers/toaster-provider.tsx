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
        toast: 'font-sans font-bold bg-ocean-200 border-ocean-200/15 text-white',
      },
    }}
  />
)
