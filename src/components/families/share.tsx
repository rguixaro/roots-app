'use client'

import { useTranslations } from 'next-intl'
import { Share2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Family } from '@/types'
import { useCopyToClipboard } from '@/hooks'
import { cn, SITE_URL } from '@/utils'

export const FamilyShare = ({
  family,
  className,
  classNameIcon,
}: {
  family: Family | null
  className?: string
  classNameIcon?: string
}) => {
  const t_toasts = useTranslations('toasts')

  const { copy } = useCopyToClipboard()

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        toast.success(t_toasts('family-link-copied'))
      })
      .catch((error) => {
        toast.error('An unexpected error has occurred. Please try again later.', {
          description: error,
        })
      })
  }

  if (!family) return null

  return (
    <button
      onClick={handleCopy(`${SITE_URL}/families/${family.slug}`)}
      className={cn('hover:bg-ocean-200/15 rounded p-1 transition-colors duration-300', className)}
    >
      <Share2Icon size={24} className={cn('text-ocean-200', classNameIcon)} />
    </button>
  )
}
