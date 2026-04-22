'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { cn } from '@/utils'

type GoBackVariant = 'plain' | 'filled'

interface GoBackProps {
  /** Destination URL. Defaults to '/'. */
  to?: string
  /** `common` namespace key used for the button text. Defaults to 'return'. */
  text?: string
  /** Visual variant */
  variant?: GoBackVariant
  /** Extra classes on the outer wrapper. */
  className?: string
  /** Extra classes on the arrow SVG. */
  classNameSvg?: string
  /** Extra classes appended to the link itself. */
  classNameLink?: string
  /** Optional right-side content rendered next to the button in the row. */
  children?: React.ReactNode
}

const variantStyles: Record<GoBackVariant, string> = {
  plain: 'rounded-[5px] p-1 px-3 text-sm md:text-base',
  filled: 'bg-pale-ocean shadow-center-sm rounded-xl gap-2 px-3 py-1.5 text-sm',
}

/**  Reusable back-navigation link */
export const GoBack = ({
  to = '/',
  text = 'return',
  variant = 'plain',
  className,
  classNameSvg,
  classNameLink,
  children,
}: GoBackProps) => {
  const t_common = useTranslations('common')

  return (
    <div className={cn('flex w-full items-center justify-between', className)}>
      <Link
        href={to}
        className={cn(
          'text-ocean-300 group flex w-fit items-center font-bold transition-all duration-300',
          'hover:bg-ocean-200/15',
          variantStyles[variant],
          classNameLink
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={variant === 'filled' ? 20 : 24}
          height={variant === 'filled' ? 20 : 24}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('stroke-ocean-300', classNameSvg)}
        >
          <line
            x1="5"
            y1="12"
            x2="19"
            y2="12"
            className="-translate-x-4 scale-x-0 transition-all duration-300 ease-in-out group-hover:-translate-x-px group-hover:scale-x-100"
          />
          <polyline
            points="12 19 5 12 12 5"
            className="translate-x-0 transition-all duration-300 ease-in-out group-hover:-translate-x-0.5"
          />
        </svg>
        <span className="transition-all duration-300">{t_common(text)}</span>
      </Link>
      {children}
    </div>
  )
}
