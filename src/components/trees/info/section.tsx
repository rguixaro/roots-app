import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

import { cn } from '@/utils'

interface SectionProps {
  title: string
  icon?: LucideIcon
  description?: string
  className?: string
  children: ReactNode
}

/** Titled section wrapper */
export function Section({ title, icon: Icon, description, className, children }: SectionProps) {
  return (
    <div
      className={cn(
        'text-ocean-400 bg-pale-ocean shadow-center-sm w-full rounded-xl p-4',
        className
      )}
    >
      <div className="mb-3">
        <span className="flex items-center gap-2 font-bold">
          {Icon && <Icon size={20} />}
          {title}
        </span>
        {description && <p className="mt-1 text-xs opacity-70">{description}</p>}
      </div>
      {children}
    </div>
  )
}
