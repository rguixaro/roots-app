'use client'

import Image from 'next/image'
import { Image as ImageIcon, LoaderIcon } from 'lucide-react'

import { usePictureState } from '@/hooks'

import { cn } from '@/utils'

interface GalleryImageProps {
  src: string | null
  alt: string
  className?: string
  iconSize?: number
  onError?: () => void
  hasError?: boolean
}

export function GalleryImage({
  src,
  alt,
  className,
  iconSize = 48,
  onError,
  hasError = false,
}: GalleryImageProps) {
  const {
    isLoading,
    hasError: loadError,
    onLoad,
    onError: internalOnError,
  } = usePictureState(src, hasError)

  const showError = hasError || loadError
  const showPlaceholder = (!src || showError) && !isLoading
  const showLoader = isLoading && !!src && !showError

  const loader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `/api/proxy?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`
  }

  const handleError = () => {
    internalOnError()
    onError?.()
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
          showLoader ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <LoaderIcon size={24} className="animate-spin opacity-70" />
      </div>

      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out',
          showPlaceholder ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        <ImageIcon size={iconSize} />
      </div>
      {src && !showError && (
        <div
          className={cn(
            'h-full w-full transition-all duration-500 ease-out',
            isLoading ? 'invisible' : 'visible'
          )}
        >
          <Image
            src={src}
            alt={alt}
            loader={loader}
            width={400}
            height={0}
            sizes="(max-width: 640px) 100vw, 96px"
            className="h-auto w-full object-cover"
            onLoad={onLoad}
            onError={handleError}
          />
        </div>
      )}
    </div>
  )
}
