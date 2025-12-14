'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, LoaderIcon } from 'lucide-react'

import { cn } from '@/utils'

import { Picture } from '@/types'

interface ProfilePictureDisplayProps {
  profilePicture: Picture | null
  errorProfilePicture: boolean
  onError: () => void
}

export function ProfilePictureDisplay({
  profilePicture,
  errorProfilePicture,
  onError,
}: ProfilePictureDisplayProps) {
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Reset loading state when profile picture or error state changes
   */
  useEffect(() => {
    setIsLoading(!!profilePicture && !errorProfilePicture)
  }, [profilePicture, errorProfilePicture])

  /**
   * Handle image load event
   */
  const handleLoad = () => setIsLoading(false)

  /**
   * Handle image error event
   */
  const handleError = () => {
    setIsLoading(false)
    onError()
  }

  const showPlaceholder = (!profilePicture || errorProfilePicture) && !isLoading
  const showLoader = isLoading && profilePicture && !errorProfilePicture

  return (
    <div
      className={cn(
        'shadow-center relative flex h-24 w-24 shrink-0 items-center justify-center',
        'bg-pale-ocean border-ocean-300 text-ocean-300 overflow-hidden rounded-lg border-4'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
          showLoader ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <LoaderIcon size={24} className="animate-spin" />
      </div>
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out',
          showPlaceholder ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        <ImageIcon size={48} />
      </div>
      {profilePicture && (
        <div
          className={cn(
            'h-full w-full transition-all duration-500 ease-out',
            isLoading || errorProfilePicture ? 'invisible' : 'visible'
          )}
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${profilePicture.fileKey}`}
            alt="Profile picture"
            fill
            style={{ objectFit: 'cover' }}
            onLoadingComplete={handleLoad}
            onError={handleError}
          />
        </div>
      )}
    </div>
  )
}
