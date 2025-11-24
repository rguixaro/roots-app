import Link from 'next/link'
import { Settings2 } from 'lucide-react'

import { Tree } from '@/types'

import { cn } from '@/utils/cn'

export const TreeEdit = ({
  tree,
  className,
  classNameIcon,
}: {
  tree: Tree | null
  className?: string
  classNameIcon?: string
}) => {
  if (!tree) return null

  return (
    <Link
      href={`/trees/edit/${tree?.slug}`}
      className={cn('hover:bg-ocean-200/15 rounded p-1 transition-colors duration-300', className)}
    >
      <Settings2 size={24} className={cn('text-ocean-200', classNameIcon)} />
    </Link>
  )
}
