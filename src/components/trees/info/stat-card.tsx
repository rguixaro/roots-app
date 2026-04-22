import { LucideIcon } from 'lucide-react'

import { cn } from '@/utils'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: LucideIcon
  className?: string
}

/** Used in overview grid and demographics breakdowns */
export function StatCard({ label, value, subtext, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-pale-ocean text-ocean-400 shadow-center-sm border-ocean-200/20 flex flex-col items-start gap-0.5 rounded-xl border-2 p-3',
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-70">
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      {subtext && <div className="text-xs opacity-70">{subtext}</div>}
    </div>
  )
}
