'use client'

import { Children, ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ExpandableProps {
  limit: number
  className?: string
  children: ReactNode
}

/**
 * Renders `children` as a list, showing only the first `limit` items when collapsed.
 * If the number of children exceeds `limit`, a toggle button appears to reveal the rest.
 */
export function Expandable({ limit, className, children }: ExpandableProps) {
  const t = useTranslations('insights')
  const [expanded, setExpanded] = useState(false)

  const items = Children.toArray(children)
  const hiddenCount = Math.max(0, items.length - limit)
  const visible = expanded || hiddenCount === 0 ? items : items.slice(0, limit)

  return (
    <>
      <div className={className}>{visible}</div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-ocean-400 hover:bg-ocean-200/15 mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors duration-200"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              {t('show-less')}
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              {t('show-more', { count: hiddenCount })}
            </>
          )}
        </button>
      )}
    </>
  )
}
