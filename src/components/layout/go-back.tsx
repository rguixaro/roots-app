'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { cn } from '@/utils'

interface GoBackProps {
  to?: string
  text?: string
  className?: string
  classNameSvg?: string
  classNameHover?: string
  children?: React.ReactNode
}

export const GoBack = ({
  to = '/',
  text = 'return',
  className,
  classNameSvg,
  classNameHover,
  children,
}: GoBackProps) => {
  const t_common = useTranslations('common')

  return (
    <div className={cn('flex w-full items-center justify-between', className)}>
      <Link
        href={to}
        className={cn(
          'text-ocean-300 flex w-fit items-center rounded-[5px] p-1 px-3 text-sm font-bold md:text-base',
          'hover:bg-ocean-200/15 group transition-all duration-300',
          classNameHover
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('stroke-ocean-200', classNameSvg)}
        >
          <line
            x1="5"
            y1="12"
            x2="19"
            y2="12"
            className="-translate-x-4 scale-x-0 transition-all duration-300 ease-in-out group-hover:-translate-x-1 group-hover:scale-x-100"
          />
          <polyline
            points="12 19 5 12 12 5"
            className="translate-x-0 transition-all duration-300 ease-in-out group-hover:-translate-x-1"
          />
        </svg>
        <span className="transition-all duration-300">{t_common(text)}</span>
      </Link>
      {children}
    </div>
  )
}
