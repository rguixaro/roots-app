'use client'

import { useTranslations } from 'next-intl'
import { Share2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { useCopyToClipboard } from '@/hooks'

import { Tree } from '@/types'

import { cn, SITE_URL } from '@/utils'

export const TreeShare = ({
  tree,
  className,
  classNameIcon,
}: {
  tree: Tree | null
  className?: string
  classNameIcon?: string
}) => {
  const t_toasts = useTranslations('toasts')

  const { copy } = useCopyToClipboard()

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        toast.success(t_toasts('tree-link-copied'))
      })
      .catch((error) => {
        toast.error('An unexpected error has occurred. Please try again later.', {
          description: error,
        })
      })
  }

  if (!tree) return null

  return (
    <button
      onClick={handleCopy(`${SITE_URL}/trees/${tree.slug}`)}
      className={cn('hover:bg-ocean-200/15 rounded p-1 transition-colors duration-300', className)}
    >
      <Share2Icon size={20} className={cn('text-ocean-200', classNameIcon)} />
    </button>
  )
}
