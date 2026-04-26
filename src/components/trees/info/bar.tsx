import { cn } from '@/utils'

interface BarProps {
  label: string
  value: number
  total: number
  valueLabel?: string
  showPercent?: boolean
  className?: string
  barClassName?: string
}

/** Horizontal percentage bar */
export function Bar({
  label,
  value,
  total,
  valueLabel,
  showPercent = true,
  className,
  barClassName,
}: BarProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0
  const display = valueLabel ?? `${value}/${total}`

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="opacity-70">
          {display}
          {showPercent && (
            <>
              {' '}
              <span className="opacity-70">({Math.round(pct)}%)</span>
            </>
          )}
        </span>
      </div>
      <div className="bg-ocean-100 shadow-center-sm h-2 w-full overflow-hidden rounded-md">
        <div
          className={cn('bg-ocean-300 h-full rounded-md transition-all', barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface StackedBarSegment {
  label: string
  value: number
  color: string
}

interface StackedBarProps {
  segments: StackedBarSegment[]
  className?: string
}

/**  Single horizontal stacked bar */
export function StackedBar({ segments, className }: StackedBarProps) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) return null

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded', seg.color)} />
            <span className="font-medium">{seg.label}</span>
            <span className="opacity-70">
              {seg.value} ({Math.round((seg.value / total) * 100)}%)
            </span>
          </span>
        ))}
      </div>
      <div className="bg-ocean-100 shadow-center-sm flex h-3 w-full overflow-hidden rounded-md">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={seg.label + i}
              className={cn('h-full transition-all', seg.color)}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}
