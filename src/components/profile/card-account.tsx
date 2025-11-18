import type { ReactNode } from 'react'

import { TypographyH4 } from '@/ui'

interface CardAccountProps {
  title: string
  children: ReactNode
  description: string
  action: ReactNode
  className?: string
}

export const CardAccount = (props: CardAccountProps) => {
  return (
    <div className="border-ocean-200/15 text-ocean-400 mt-5 flex w-full flex-col rounded border-2 p-4">
      <div className="mb-2 flex flex-col space-y-3 rounded">
        <div className="flex items-center justify-between space-x-2">
          <TypographyH4 className="text-ocean-300 my-0">{props.title}</TypographyH4>
          {props.action}
        </div>
        <p className="text-sm opacity-70">{props.description}</p>
      </div>
      {props.children}
    </div>
  )
}
