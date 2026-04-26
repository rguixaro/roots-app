'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LoaderIcon, ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { getImageAssetUrl, publicImagesEnabled } from '@/config/images'

import { usePictureState } from '@/hooks'

import { cn } from '@/utils'

interface PictureProps {
  fileKey?: string | null
  classNamePicture?: string
  classNameContainer?: string
  classNameImage?: string
  disablePlaceholder?: boolean
  iconSize?: number
  animated?: boolean
  sizes?: string
  quality?: number
}

export const Picture: React.FC<PictureProps> = ({
  fileKey,
  classNamePicture,
  classNameContainer,
  classNameImage,
  disablePlaceholder = false,
  iconSize = 24,
  animated = true,
  sizes = '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  quality,
}) => {
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({})

  const src = fileKey ? (cachedImages[fileKey] ?? getImageAssetUrl(fileKey)) : null

  const { isLoading, hasError, onLoad, onError } = usePictureState(src)

  const showPlaceholder = !disablePlaceholder && (!src || hasError) && !isLoading
  const showLoader = isLoading && !hasError
  const isLoaded = !!src && !isLoading && !hasError

  const handleLoad = () => {
    onLoad()
    if (fileKey && src && !cachedImages[fileKey]) {
      setCachedImages((prev) => ({
        ...prev,
        [fileKey]: src,
      }))
    }
  }

  const loader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `/api/proxy?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`
  }

  return (
    <motion.div
      data-picture-loaded={isLoaded ? 'true' : undefined}
      className={cn(
        'border-ocean-50 relative overflow-hidden rounded-lg border-2',
        classNameContainer,
        !showPlaceholder && !showLoader && 'shadow-center-sm'
      )}
      initial="idle"
      whileHover="hover"
      variants={
        animated
          ? {
              idle: { scale: 1 },
              hover: {
                scale: 1.08,
                transition: { type: 'spring', stiffness: 300, damping: 20 },
              },
            }
          : undefined
      }
    >
      {showLoader && (
        <div
          data-picture-loader="true"
          className={cn(
            'bg-ocean-50 absolute inset-0 flex items-center justify-center',
            classNamePicture
          )}
        >
          <LoaderIcon className="animate-spin" size={iconSize} />
        </div>
      )}
      {showPlaceholder && (
        <div
          className={cn(
            'bg-ocean-50 absolute inset-0 flex items-center justify-center',
            'text-ocean-300 group-hover:text-ocean-50',
            classNamePicture
          )}
        >
          <ImageIcon size={iconSize} />
        </div>
      )}
      {publicImagesEnabled && src && !hasError && (
        <div
          data-picture-image="true"
          className={cn(
            'absolute inset-0 transition-all duration-500 ease-out',
            isLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          )}
        >
          <Image
            src={src}
            alt="Picture"
            fill={true}
            className={cn('object-cover', classNameImage)}
            loader={loader}
            onLoad={handleLoad}
            onError={onError}
            sizes={sizes}
            quality={quality}
          />
        </div>
      )}
    </motion.div>
  )
}
