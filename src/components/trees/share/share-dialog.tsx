'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Copy, Link as LinkIcon, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useCopyToClipboard } from '@/hooks'

import { generateShareToken, getShareLink } from '@/server/actions/trees'
import type { ShareTokenTtlDays } from '@/server/actions/trees'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui'

interface ShareDialogProps {
  treeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TTL_OPTIONS: ShareTokenTtlDays[] = [1, 7, 30]

export function ShareDialog({ treeId, open, onOpenChange }: ShareDialogProps) {
  const t = useTranslations('share')
  const t_toasts = useTranslations('toasts')
  const t_errors = useTranslations('errors')

  const [ttl, setTtl] = useState<ShareTokenTtlDays>(7)
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [daysLeft, setDaysLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { copy } = useCopyToClipboard()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    getShareLink(treeId)
      .then((link) => {
        if (cancelled) return
        if (link) {
          setToken(link.token)
          setExpiresAt(new Date(link.expiresAt))
        } else {
          setToken(null)
          setExpiresAt(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, treeId])

  const shareUrl =
    token && typeof window !== 'undefined' ? `${window.location.origin}/trees/join/${token}` : ''

  useEffect(() => {
    if (!expiresAt) {
      setDaysLeft(0)
      return
    }
    setDaysLeft(Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)))
  }, [expiresAt])

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      const result = await generateShareToken(treeId, ttl)
      if (result.error || !result.token || !result.expiresAt) {
        toast.error(t_errors('error'))
        return
      }
      setToken(result.token)
      setExpiresAt(new Date(result.expiresAt))
      toast.success(t('toast-generated'))
    })
  }, [treeId, ttl, t, t_errors])

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return
    const ok = await copy(shareUrl)
    if (ok) toast.success(t_toasts('tree-link-copied'))
    else toast.error(t_errors('error'))
  }, [shareUrl, copy, t_toasts, t_errors])

  const busy = loading || isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {token && expiresAt ? (
            <>
              <div>
                <label className="text-ocean-400 mb-1 block text-xs font-semibold">
                  {t('link-label')}
                </label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={shareUrl} className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    disabled={busy}
                    aria-label={t('copy')}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                <p className="text-ocean-300 mt-2 text-xs">
                  {daysLeft === 0 ? t('expires-today') : t('expires-in', { days: daysLeft })}
                </p>
              </div>

              <div className="bg-ocean-200/30 h-px w-full" />
            </>
          ) : !loading ? (
            <p className="text-ocean-300 text-sm">
              <LinkIcon className="mr-2 inline" size={14} />
              {t('no-active-link')}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <label className="text-ocean-400 text-xs font-semibold">{t('ttl-label')}</label>
            <Select value={String(ttl)} onValueChange={(v) => setTtl(Number(v) as ShareTokenTtlDays)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTL_OPTIONS.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {t(`ttl-${days}-day${days === 1 ? '' : 's'}` as 'ttl-1-day' | 'ttl-7-days' | 'ttl-30-days')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="default"
            onClick={handleGenerate}
            disabled={busy}
            Icon={RefreshCw}
            iconPlacement="left"
            className="w-full"
          >
            {token ? t('rotate') : t('generate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
