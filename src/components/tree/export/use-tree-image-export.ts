'use client'

import { RefObject, useCallback, useState } from 'react'
import { toBlob } from 'html-to-image'

import { waitForTreeExportAssets } from './assets'

type RestoreExportView = () => Promise<void> | void
type PrepareExportView = () => Promise<RestoreExportView | void> | RestoreExportView | void

const waitForFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const MAX_EXPORT_PIXELS = 28_000_000

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function getPixelRatio(element: HTMLElement) {
  const width = element.offsetWidth
  const height = element.offsetHeight
  const adaptiveRatio = Math.sqrt(MAX_EXPORT_PIXELS / Math.max(width * height, 1))

  return Math.max(1.25, Math.min(3, adaptiveRatio))
}

function prepareFullGraphCapture(element: HTMLElement): () => void {
  const viewport = element.querySelector<HTMLElement>('.react-flow__viewport')
  const graphNodes = Array.from(element.querySelectorAll<HTMLElement>('.react-flow__node'))
  if (!viewport || graphNodes.length === 0) return () => undefined

  const elementRect = element.getBoundingClientRect()
  const bounds = graphNodes.reduce(
    (acc, node) => {
      const rect = node.getBoundingClientRect()
      return {
        left: Math.min(acc.left, rect.left - elementRect.left),
        top: Math.min(acc.top, rect.top - elementRect.top),
        right: Math.max(acc.right, rect.right - elementRect.left),
        bottom: Math.max(acc.bottom, rect.bottom - elementRect.top),
      }
    },
    {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
    }
  )

  const padding = 120
  const width = Math.ceil(bounds.right - bounds.left + padding * 2)
  const height = Math.ceil(bounds.bottom - bounds.top + padding * 2)
  const shiftX = Math.round(-bounds.left + padding)
  const shiftY = Math.round(-bounds.top + padding)

  const previousElementWidth = element.style.width
  const previousElementHeight = element.style.height
  const previousElementOverflow = element.style.overflow
  const previousViewportTransform = viewport.style.transform
  const previousViewportTransformOrigin = viewport.style.transformOrigin

  element.style.width = `${width}px`
  element.style.height = `${height}px`
  element.style.overflow = 'hidden'
  viewport.style.transformOrigin = '0 0'
  viewport.style.transform = `translate(${shiftX}px, ${shiftY}px) ${previousViewportTransform}`

  return () => {
    element.style.width = previousElementWidth
    element.style.height = previousElementHeight
    element.style.overflow = previousElementOverflow
    viewport.style.transform = previousViewportTransform
    viewport.style.transformOrigin = previousViewportTransformOrigin
  }
}

export function useTreeImageExport(
  containerRef: RefObject<HTMLElement | null>,
  filename: string,
  prepare?: PrepareExportView
) {
  const [isExporting, setIsExporting] = useState(false)

  const exportTreeImage = useCallback(async () => {
    setIsExporting(true)
    await waitForFrame()

    let restore: RestoreExportView | void = undefined
    let restoreGraphCapture: (() => void) | void = undefined

    try {
      restore = await prepare?.()
      await waitForFrame()
      await waitForFrame()

      const element = containerRef.current?.querySelector<HTMLElement>('.react-flow')
      if (!element) return { error: true as const, message: 'error' }

      await waitForTreeExportAssets(element)
      element.classList.add('tree-exporting')
      restoreGraphCapture = prepareFullGraphCapture(element)
      await waitForFrame()

      const blob = await toBlob(element, {
        cacheBust: true,
        pixelRatio: getPixelRatio(element),
        backgroundColor: '#e1ecee',
      })

      if (!blob) return { error: true as const, message: 'error' }

      downloadBlob(blob, filename)
      return { error: false as const }
    } catch {
      return { error: true as const, message: 'error' }
    } finally {
      restoreGraphCapture?.()
      containerRef.current
        ?.querySelector<HTMLElement>('.react-flow')
        ?.classList.remove('tree-exporting')
      await restore?.()
      setIsExporting(false)
    }
  }, [containerRef, filename, prepare])

  return {
    isExporting,
    exportTreeImage,
  }
}
