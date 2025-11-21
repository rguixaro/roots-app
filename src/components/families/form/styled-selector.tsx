'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

import { cn } from '@/utils'

import { Icon } from '../../families/icon'

interface StyledSelectorProps<T extends string = string> {
  types: readonly T[]
  value?: T
  setValue: (value: T) => void
  disabled?: boolean
}

export const StyledSelector = <T extends string>({
  types,
  value,
  setValue,
  disabled,
}: StyledSelectorProps<T>) => {
  const t_enums = useTranslations('enums')

  return (
    <div className="no-scrollbar flex snap-x overflow-x-scroll py-2">
      {types.map((name) => {
        const isActive = value === name
        return (
          <button
            type="button"
            onClick={() => {
              if (disabled) return
              setValue(name)
            }}
            key={name}
            className={cn(
              'bg-ocean-200/15 relative mx-1 flex min-w-18 snap-center flex-col items-center justify-center rounded py-3 shadow-sm',
              'border-ocean-200/15 border-2 transition-all duration-400 hover:scale-[1.05]',
              isActive && 'border-ocean-200'
            )}
          >
            <Icon type={name} size={24} />
            {t_enums(name.toLocaleLowerCase()).length > 0 && (
              <span
                className={cn(
                  'text-ocean-200/75 pt-3 text-xs font-medium',
                  isActive && 'text-ocean-200 font-bold'
                )}
              >
                {t_enums(name.toLowerCase())}
              </span>
            )}
            <div
              className={cn(
                'border-ocean-200 bg-pale-ocean absolute -top-1 -right-1 rounded border-2',
                'transition-opacity duration-300',
                isActive ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Check size={14} className="stroke-ocean-200" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
