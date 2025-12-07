import type { ReactNode } from 'react'

import { cn } from '@/utils'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout(props: AuthLayoutProps) {
  return (
    <main className={cn('flex min-h-screen w-full items-center justify-center overflow-hidden')}>
      <div className="flex w-full flex-col items-center justify-center">{props.children}</div>
    </main>
  )
}
