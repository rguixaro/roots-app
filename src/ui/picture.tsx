'use client'

import Image from 'next/image'
import { LoaderIcon, ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { usePictureState } from '@/hooks'

import { cn } from '@/utils'

interface PictureProps {
  fileKey?: string | null
  classNamePicture?: string
  classNameContainer?: string
  disablePlaceholder?: boolean
  iconSize?: number
}

export const Picture: React.FC<PictureProps> = ({
  fileKey,
  classNamePicture,
  classNameContainer,
  disablePlaceholder = false,
  iconSize = 24,
}) => {
  const src = fileKey ? `${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${fileKey}` : null

  const { isLoading, hasError, onLoad, onError } = usePictureState(src)

  const showPlaceholder = !disablePlaceholder && (!src || hasError) && !isLoading
  const showLoader = isLoading && !hasError

  const loader = ({ src }: { src: string }) => src

  return (
    <motion.div
      className={cn(
        'border-ocean-50 relative overflow-hidden rounded-lg border-2',
        classNameContainer,
        !showPlaceholder && !showLoader && 'shadow-center-sm'
      )}
      initial="idle"
      whileHover="hover"
      variants={{
        idle: { scale: 1 },
        hover: {
          scale: 1.08,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        },
      }}
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
            src={`/api/proxy?url=${encodeURIComponent(src)}`}
            alt="Picture"
            fill
            className="object-cover"
            loader={loader}
            onLoadingComplete={onLoad}
            onError={onError}
          />
        </div>
      )}
    </motion.div>
  )
}
