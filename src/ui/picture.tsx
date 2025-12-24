'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LoaderIcon, ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'

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
}

export const Picture: React.FC<PictureProps> = ({
  fileKey,
  classNamePicture,
  classNameContainer,
  classNameImage,
  disablePlaceholder = false,
  iconSize = 24,
  animated = true,
}) => {
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({})

  const src = fileKey
    ? (cachedImages[fileKey] ?? `${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${fileKey}`)
    : null

  const { isLoading, hasError, onLoad, onError } = usePictureState(src)

  const showPlaceholder = !disablePlaceholder && (!src || hasError) && !isLoading
  const showLoader = isLoading && !hasError

  const handleLoad = () => {
    onLoad()
    if (fileKey && !cachedImages[fileKey]) {
      setCachedImages((prev) => ({
        ...prev,
        [fileKey]: `${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${fileKey}`,
      }))
    }
  }

  const loader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    return `/api/proxy?url=${encodeURIComponent(src)}&w=${width}${quality ? `&q=${quality}` : ''}`
  }

  return (
    <motion.div
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
            classNamePicture
          )}
        >
          <ImageIcon className="stroke-ocean-400 group-hover:stroke-ocean-50" size={iconSize} />
        </div>
      )}
      {src && !hasError && (
        <div
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
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      )}
    </motion.div>
  )
}
