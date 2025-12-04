'use client'

import React, { useState, useEffect } from 'react'
import { Image, LoaderIcon } from 'lucide-react'

import { cn } from '@/utils'

interface GalleryImageProps {
  src: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  /**
   * Reset loading state when src or hasError changes
   */
  useEffect(() => {
    if (!src) {
      setIsLoading(false)
      setLoadError(true)
    } else if (!hasError) {
      setIsLoading(true)
      setLoadError(false)
    }
  }, [src, hasError])

  const showError = hasError || loadError
  const showPlaceholder = (!src || showError) && !isLoading
  const showLoader = isLoading && src && !showError

  /**
   * Handle image load event
   */
  const handleLoad = () => setIsLoading(false)

  /**
   * Handle image error event
   */
  const handleError = () => {
    setIsLoading(false)
    setLoadError(true)
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
        <Image size={iconSize} />
      </div>
      {src && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover transition-all duration-500 ease-out',
            isLoading || showError ? 'invisible' : 'visible'
          )}
        />
      )}
    </div>
  )
}
