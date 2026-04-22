'use client'

import { useState } from 'react'
import { Share2, ImageDown, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { ShareDialog } from '@/components/trees/share'

import { cn } from '@/utils'

interface ShareDownloadProps {
  treeId: string
  canShare: boolean
}

/** Share & export section for the tree hub */
export function TreeInfoShareDownload({ treeId, canShare }: ShareDownloadProps) {
  const t = useTranslations('tree-info')
  const t_common = useTranslations('common')
  const [shareOpen, setShareOpen] = useState(false)

  const handleDownload = () => {
    toast.info(t_common('unavailable-feature'))
  }

  return (
    <div className="text-ocean-400 bg-pale-ocean shadow-center-sm w-full rounded-xl p-4">
      <div className="mb-3">
        <span className="flex items-center gap-2 font-bold">
          <Send size={20} />
          {t('share-download-title')}
        </span>
        <p className="mt-1 text-xs opacity-70">{t('share-download-description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <button
          type="button"
          onClick={handleDownload}
          className={cn(
            'bg-ocean-200 hover:bg-ocean-300 shadow-center-sm group text-neutral-50',
            'flex cursor-pointer items-center gap-3 rounded-lg p-4 text-left transition-all'
          )}
        >
          <div className="bg-ocean-50/20 flex h-10 w-10 items-center justify-center rounded-full">
            <ImageDown size={20} className="text-neutral-50" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold">{t('action-export-image')}</div>
            <div className="text-xs opacity-80">{t('action-export-image-description')}</div>
          </div>
        </button>
      </div>
      {canShare && <ShareDialog treeId={treeId} open={shareOpen} onOpenChange={setShareOpen} />}
    </div>
  )
}
