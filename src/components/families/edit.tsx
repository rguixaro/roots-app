import Link from 'next/link'
import { Settings2 } from 'lucide-react'

import { Family } from '@/types'
import { cn } from '@/utils/cn'

export const FamilyEdit = ({
  family,
  className,
  classNameIcon,
}: {
  family: Family | null
  className?: string
  classNameIcon?: string
}) => {
  if (!family) return null

  return (
    <Link
      href={`/families/edit/${family?.slug}`}
      className={cn('hover:bg-ocean-200/15 rounded p-1 transition-colors duration-300', className)}
    >
      <Settings2 size={24} className={cn('text-ocean-200', classNameIcon)} />
    </Link>
  )
}
