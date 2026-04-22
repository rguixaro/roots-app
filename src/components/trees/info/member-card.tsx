import { Picture } from '@/ui'

import { cn } from '@/utils'

interface MemberCardProps {
  picture?: string | null
  name: string
  primary?: string
  secondary?: string
  className?: string
}

export function MemberCard({ picture, name, primary, secondary, className }: MemberCardProps) {
  return (
    <div
      className={cn(
        'bg-pale-ocean shadow-center-sm border-ocean-200/20 group flex w-44 shrink-0 flex-col overflow-hidden rounded-xl border-2 transition-transform duration-300 hover:-translate-y-0.5',
        className
      )}
    >
      <div className="aspect-4/3 w-full overflow-hidden">
        <Picture
          fileKey={picture}
          classNameContainer="h-full w-full rounded-none border-0 shadow-none"
          animated={false}
        />
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2.5 text-center">
        <p className="line-clamp-2 text-xs leading-tight font-bold">{name}</p>
        {primary && <p className="truncate text-xs opacity-80">{primary}</p>}
        {secondary && <p className="truncate text-xs opacity-60">{secondary}</p>}
      </div>
    </div>
  )
}
