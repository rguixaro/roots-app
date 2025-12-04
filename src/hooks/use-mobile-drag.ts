'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseMobileDragOptions {
  initialHeight?: number
  minHeight?: number
  maxHeight?: number
}

export function useMobileDrag(options: UseMobileDragOptions = {}) {
  const { initialHeight = 90, minHeight = 30, maxHeight = 95 } = options

  const [modalHeight, setModalHeight] = useState(initialHeight)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startHeight: 0 })

  /**
   * Effect to check if the device is mobile based on window width
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkMobile = () => setIsMobile(window.innerWidth < 640)

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  /**
   * Handle drag start for mobile modal resizing
   * @param e React.MouseEvent | React.TouchEvent
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return

      e.preventDefault()
      setIsDragging(true)

      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      dragStartRef.current = { x: 0, y: clientY, startHeight: modalHeight }
    },
    [modalHeight, isMobile]
  )

  /**
   * Handle drag move for mobile modal resizing
   * @param e MouseEvent | TouchEvent
   */
  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !isMobile) return

      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const deltaY = clientY - dragStartRef.current.y

      const heightDelta = -(deltaY / window.innerHeight) * 100
      const newHeight = Math.min(
        maxHeight,
        Math.max(minHeight, dragStartRef.current.startHeight + heightDelta)
      )
      setModalHeight(newHeight)
    },
    [isDragging, isMobile, maxHeight, minHeight]
  )

  /**
   * Handle drag end for mobile modal resizing
   */
  const handleDragEnd = useCallback(() => setIsDragging(false), [])

  /**
   * Effect to handle adding/removing event listeners for dragging on mobile modal resizing
   */
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e)
      const handleTouchMove = (e: TouchEvent) => handleDragMove(e)
      const handleMouseUp = () => handleDragEnd()
      const handleTouchEnd = () => handleDragEnd()

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  return {
    modalHeight,
    isDragging,
    isMobile,
    handleDragStart,
  }
}
