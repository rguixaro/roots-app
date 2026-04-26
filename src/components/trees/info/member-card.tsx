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
        'bg-pale-ocean text-ocean-400 shadow-center-sm border-ocean-200/20 hover:bg-ocean-50 flex w-44 shrink-0 flex-col overflow-hidden rounded-xl border-2 transition-colors duration-300',
        className
      )}
    >
      <div className="aspect-4/3 w-full overflow-hidden">
        <Picture
          fileKey={picture}
          classNameContainer="h-full w-full rounded-none border-0 shadow-none"
          classNamePicture="bg-pale-ocean"
          animated={false}
        />
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2.5 text-center">
        <p className="line-clamp-2 text-xs leading-tight font-bold">{name}</p>
        {primary && <p className="line-clamp-2 text-xs leading-tight opacity-80">{primary}</p>}
        {secondary && <p className="truncate text-xs opacity-60">{secondary}</p>}
      </div>
    </div>
  )
}
