'use client'

import { useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowDownToLine } from 'lucide-react'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'

import { Family } from '@/types'
import { TypographyH1, TypographyH4 } from '@/ui'
import { cn } from '@/utils'

export const FamilyDownload = ({
  family,
  className,
  classNameIcon,
}: {
  family: Family | null
  className?: string
  classNameIcon?: string
}) => {
  const t_errors = useTranslations('errors')
  const ref = useRef<HTMLDivElement>(null)

  const onButtonClick = useCallback(() => {
    if (ref.current === null || !family) return

    toPng(ref.current, {
      cacheBust: true,
      backgroundColor: '#eaf0e2',
      quality: 1,
      width: 384,
    })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `${family.slug}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((_err) => {
        toast.error(t_errors('error'))
      })
  }, [ref, family, t_errors])

  if (!family) return null

  return (
    <button
      onClick={onButtonClick}
      className={cn('hover:bg-ocean-200/15 rounded p-1 transition-colors duration-300', className)}
    >
      <ArrowDownToLine size={24} className={cn('text-ocean-200', classNameIcon)} />
      {/* <div className="pointer-events-none absolute w-96 opacity-0">
        <div ref={ref} className="flex w-full flex-col items-center justify-center">
          <div className="border-ocean-300 h-36 w-4/5 border-b-4 text-center">
            <TypographyH1 className="font-title text-ocean-300 pb-5">{'Roots'}</TypographyH1>
          </div>
          <div className={cn('my-3 flex w-full flex-col items-center justify-center p-5')}>
            <TypographyH4 className="text-ocean-300 text-2xl font-bold">{family.name}</TypographyH4>
            <div className="bg-ocean-300/75 mt-7 h-1 w-2/4" />
            <div className="mt-5">
              <p>{t('more-on')}</p>
              <p className="text-ocean-300 font-extrabold">roots.rguixaro.dev</p>
            </div>
          </div>
        </div>
      </div> */}
    </button>
  )
}
