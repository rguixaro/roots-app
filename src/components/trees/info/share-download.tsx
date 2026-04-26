'use client'

import { useState } from 'react'
import { FileJson, Images, Share2, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ShareDialog } from '@/components/trees/share'
import { publicImagesEnabled } from '@/config/images'

import { cn } from '@/utils'

interface ShareDownloadProps {
  treeId: string
  slug: string
  canShare: boolean
  canExportData: boolean
  canExportGallery: boolean
}

/** Share & export section for the tree hub */
export function TreeInfoShareDownload({
  treeId,
  slug,
  canShare,
  canExportData,
  canExportGallery,
}: ShareDownloadProps) {
  const t = useTranslations('tree-info')
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <div className="text-ocean-400 bg-pale-ocean shadow-center-sm w-full rounded-xl p-4">
      <div className="mb-3">
        <span className="flex items-center gap-2 font-bold">
          <Send size={20} />
          {t('share-download-title')}
        </span>
        <p className="mt-1 text-xs opacity-70">{t('share-download-description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {canShare && (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className={cn(
              'bg-ocean-200 hover:bg-ocean-300 shadow-center-sm group text-neutral-50',
              'flex cursor-pointer items-center gap-3 rounded-xl p-4 text-left transition-all'
            )}
          >
            <div className="bg-ocean-50/20 flex h-10 w-10 items-center justify-center rounded-full">
              <Share2 size={20} className="text-neutral-50" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{t('action-share')}</div>
              <div className="text-xs opacity-80">{t('action-share-description')}</div>
            </div>
          </button>
        )}
        {canExportData && (
          <a
            href={`/api/trees/${slug}/export/data`}
            className={cn(
              'bg-ocean-200 hover:bg-ocean-300 shadow-center-sm group text-neutral-50',
              'flex cursor-pointer items-center gap-3 rounded-lg p-4 text-left transition-all'
            )}
          >
            <div className="bg-ocean-50/20 flex h-10 w-10 items-center justify-center rounded-full">
              <FileJson size={20} className="text-neutral-50" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{t('action-export-data')}</div>
              <div className="text-xs opacity-80">{t('action-export-data-description')}</div>
            </div>
          </a>
        )}
        {publicImagesEnabled && canExportGallery && (
          <a
            href={`/api/trees/${slug}/export/gallery`}
            className={cn(
              'bg-ocean-200 hover:bg-ocean-300 shadow-center-sm group text-neutral-50',
              'flex cursor-pointer items-center gap-3 rounded-lg p-4 text-left transition-all'
            )}
          >
            <div className="bg-ocean-50/20 flex h-10 w-10 items-center justify-center rounded-full">
              <Images size={20} className="text-neutral-50" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{t('action-export-gallery')}</div>
              <div className="text-xs opacity-80">{t('action-export-gallery-description')}</div>
            </div>
          </a>
        )}
      </div>
      {canShare && <ShareDialog treeId={treeId} open={shareOpen} onOpenChange={setShareOpen} />}
    </div>
  )
}
