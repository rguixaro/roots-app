'use client'

import React from 'react'

import { cn } from '@/utils'

interface ModalBackdropProps {
  show: boolean
  onClick: () => void
}

export function ModalBackdrop({ show, onClick }: ModalBackdropProps) {
  return (
    <div
      className={cn(
        'bg-ocean-500/50 fixed inset-0 z-30 backdrop-blur-xs transition-opacity duration-300',
        show ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      onClick={onClick}
    />
  )
}
