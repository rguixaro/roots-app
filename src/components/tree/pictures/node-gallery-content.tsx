'use client'

import React from 'react'
import { LoaderIcon, Menu, X } from 'lucide-react'

import { Icon } from '@/components/trees/icon'

import { Button, TypographyH5 } from '@/ui'

import { cn } from '@/utils'

import { Picture, TreeType } from '@/types'

import { GalleryImage } from './gallery-image'

interface NodeGalleryContentProps {
  readonly: boolean
  treeType: TreeType
  pictures: Picture[]
  loadingPictures: boolean
  loading: boolean
  errorGalleryPicture: { [key: string]: boolean }
  tappedImageId: string | null
  isMobile: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onTappedImageChange: (pictureId: string | null) => void
  onPictureMenuOpen: (e: React.MouseEvent, picture: Picture) => void
  onGalleryPictureError: (pictureId: string) => void
  onClose?: () => void
  t_trees: (key: string) => string
}

export function NodeGalleryContent({
  readonly,
  treeType,
  pictures,
  loadingPictures,
  loading,
  errorGalleryPicture,
  tappedImageId,
  isMobile,
  fileInputRef,
  onFileChange,
  onTappedImageChange,
  onPictureMenuOpen,
  onGalleryPictureError,
  onClose,
  t_trees,
}: NodeGalleryContentProps) {
  if (isMobile) {
    return (
      <div
        className={cn('bg-ocean-400 text-pale-ocean shadow-center-sm h-full flex-col rounded-xl')}
      >
        <div className="styled-scrollbar flex w-full flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6 text-start">
          <div className="mt-4 mb-6 flex flex-col items-start gap-x-3 gap-y-2">
            <p>{t_trees('node-gallery-description')} </p>
            {!readonly && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="hover:text-ocean-50 bg-ocean-300 mt-5 cursor-pointer self-center"
              >
                <span className="text-sm font-bold">{t_trees('node-gallery-upload')}</span>
              </Button>
            )}
          </div>
          {!readonly && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          )}
          {loadingPictures ? (
            <div className="flex items-center justify-center py-8">
              <LoaderIcon size={24} className="text-pale-ocean animate-spin" />
            </div>
          ) : pictures.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-5 pb-24 text-center">
              <p>{t_trees('node-gallery-empty')}</p>
            </div>
          ) : (
            <div className="columns-[124px] gap-2">
              {pictures.map((picture, idx) => (
                <div
                  key={picture.id}
                  className={cn(
                    'group shadow-center relative mb-2 shrink-0 cursor-pointer break-inside-avoid',
                    'bg-ocean-300 text-ocean-200 rounded-lg'
                  )}
                  onClick={() =>
                    onTappedImageChange(tappedImageId === picture.id ? null : picture.id)
                  }
                >
                  <GalleryImage
                    src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${picture.fileKey}`}
                    alt={`Picture ${idx + 1}`}
                    className="min-h-[124px] w-full"
                    hasError={errorGalleryPicture[picture.id]}
                    onError={() => onGalleryPictureError(picture.id)}
                  />
                  <div
                    className={cn(
                      'bg-ocean-500 pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-300',
                      tappedImageId === picture.id ? 'opacity-20' : 'opacity-0'
                    )}
                  />
                  <div
                    className={cn(
                      'absolute top-0 right-0 mt-2 mr-2 flex items-end justify-center gap-2 rounded transition-opacity duration-300',
                      tappedImageId === picture.id
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => onPictureMenuOpen(e, picture)}
                      className="bg-pale-ocean text-ocean-400 shadow-center cursor-pointer rounded-lg p-2 transition-all duration-200"
                    >
                      <Menu size={18} />
                    </button>
                  </div>
                  <div
                    className={cn(
                      'bg-pale-ocean text-ocean-400 pointer-events-none absolute right-0 bottom-0 left-0 mx-2 mb-2 flex justify-between rounded px-3 py-px text-sm opacity-0',
                      'shadow-center-sm transition-opacity duration-300',
                      tappedImageId === picture.id ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    <span>{picture.date?.toLocaleDateString()}</span>
                    <div className="flex items-center space-x-1">
                      <Icon size={12} type={treeType} className="stroke-ocean-400" />
                      <span>{picture.tags?.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="styled-scrollbar flex w-full flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6 text-start">
      <div className="mt-4 mb-6 flex flex-col items-start gap-x-3 gap-y-2">
        <div className="flex w-full items-center justify-between space-x-3">
          <TypographyH5>{t_trees('node-gallery')}</TypographyH5>
          <button
            onClick={onClose}
            type="button"
            className="hover:bg-ocean-200/50 self-start rounded p-1 transition-colors duration-300"
          >
            <X size={24} className="text-pale-ocean" />
          </button>
        </div>
        <p>{t_trees('node-gallery-description')} </p>
        {!readonly && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="hover:text-ocean-50 bg-ocean-300 mt-5 cursor-pointer self-center"
          >
            <span className="text-sm font-bold">{t_trees('node-gallery-upload')}</span>
          </Button>
        )}
      </div>
      {!readonly && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      )}
      {loadingPictures ? (
        <div className="flex items-center justify-center py-8">
          <LoaderIcon size={24} className="text-pale-ocean animate-spin" />
        </div>
      ) : pictures.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center space-y-5 pb-24 text-center">
          <p>{t_trees('node-gallery-empty')}</p>
        </div>
      ) : (
        <div className="columns-[124px] gap-2 sm:columns-[124px] xl:columns-3xs">
          {pictures.map((picture, idx) => (
            <div
              key={picture.id}
              className={cn(
                'group shadow-center-sm relative mb-2 shrink-0 cursor-pointer break-inside-avoid',
                'bg-ocean-300 text-ocean-200 rounded-lg'
              )}
            >
              <GalleryImage
                src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${picture.fileKey}`}
                alt={`Picture ${idx + 1}`}
                className="shadow-center-sm bg-ocean-300 mb-2 min-h-[124px] w-full"
                hasError={errorGalleryPicture[picture.id]}
                onError={() => onGalleryPictureError(picture.id)}
              />
              <div className="bg-ocean-500 pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
              <div
                className={cn(
                  'pointer-events-none absolute top-0 right-0 mt-2 mr-2 flex items-end justify-center gap-2 rounded opacity-0',
                  'transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100'
                )}
              >
                <button
                  type="button"
                  onClick={(e) => onPictureMenuOpen(e, picture)}
                  className="bg-pale-ocean text-ocean-400 shadow-center-sm cursor-pointer rounded-lg p-2 transition-all duration-200"
                >
                  <Menu size={18} />
                </button>
              </div>
              <div
                className={cn(
                  'bg-pale-ocean text-ocean-400 pointer-events-none absolute right-0 bottom-0 left-0 mx-2 mb-2 flex justify-between rounded px-3 py-px text-sm opacity-0',
                  'shadow-center-sm transition-opacity duration-300 group-hover:opacity-100'
                )}
              >
                <span>{picture.date?.toLocaleDateString()}</span>
                <div className="flex items-center space-x-1">
                  <Icon size={12} type={treeType} className="stroke-ocean-400" />
                  <span>{picture.tags?.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
