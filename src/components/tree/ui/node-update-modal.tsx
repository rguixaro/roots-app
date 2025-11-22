'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { LoaderIcon, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { type z } from 'zod'

import { UpdateTreeNodeSchema } from '@/server/schemas'

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TypographyH4,
  TypographyH5,
} from '@/ui'

import { checkKeyDown, cn } from '@/utils'

import { TreeNode } from '@/types'

interface NodeUpdateModalProps {
  showModal: boolean
  node: TreeNode | null
  form: UseFormReturn<z.infer<typeof UpdateTreeNodeSchema>>
  onUpdate: (values: z.infer<typeof UpdateTreeNodeSchema>) => Promise<void>
  onClose: () => void
  onDelete: () => void
}

export function NodeUpdateModal({
  showModal,
  node,
  form,
  onUpdate,
  onClose,
  onDelete,
}: NodeUpdateModalProps) {
  const t_common = useTranslations('common')
  const t_tree = useTranslations('tree')
  const t_toasts = useTranslations('toasts')

  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [modalHeight, setModalHeight] = useState(90)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startHeight: 0 })

  const fullName = form.watch('fullName')
  const birthDate = form.watch('birthDate')
  const deathDate = form.watch('deathDate')
  const gender = form.watch('gender')

  /**
   * Handle form submission
   */
  const submit = form.handleSubmit(async (values) => {
    setLoading(true)
    await onUpdate(values)
    setLoading(false)
  })

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
      const newHeight = Math.min(95, Math.max(30, dragStartRef.current.startHeight + heightDelta))
      setModalHeight(newHeight)
    },
    [isDragging, isMobile]
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

  /**
   * Effect to disable background scrolling when modal is open
   */
  useEffect(() => {
    const html = document.documentElement
    const body = document.body

    if (showModal) {
      const originalHtmlOverflow = html.style.overflow
      const originalBodyOverflow = body.style.overflow

      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'

      return () => {
        html.style.overflow = originalHtmlOverflow
        body.style.overflow = originalBodyOverflow
      }
    }
  }, [showModal])

  /**
   * Effect to reset form when modal is closed
   */
  useEffect(() => {
    if (!showModal) {
      form.reset()
      setEditMode(false)
      setLoading(false)
    }
  }, [showModal, form])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'bg-ocean-100/50 fixed inset-0 z-50 backdrop-blur-xs transition-opacity duration-300',
          showModal ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className={cn(
          'text-ocean-400 fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out',
          'sm:top-0 sm:left-0 sm:h-full sm:w-2/5',
          isDragging ? 'transition-none' : 'transition-transform duration-300',
          isMobile ? 'border-t-8' : '',
          showModal
            ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0'
            : 'translate-y-full sm:-translate-x-full sm:translate-y-0'
        )}
        style={{
          height: isMobile ? `${modalHeight}vh` : '100vh',
          transform: showModal
            ? !isMobile
              ? ''
              : 'translateY(0)'
            : !isMobile
              ? ''
              : 'translateY(100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Form {...form}>
          <form
            onSubmit={submit}
            onKeyDown={(e) => checkKeyDown(e)}
            className="flex h-full w-full flex-col"
          >
            <div className="bg-pale-ocean shadow-2l border-ocean-200 h-full flex-col overflow-hidden border-r-8 sm:flex sm:flex-row">
              {/* Mobile drag handle */}
              <div
                className="flex cursor-row-resize justify-center pt-3 pb-2 select-none sm:hidden"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <div
                  className={cn(
                    'bg-ocean-100 h-1.5 w-12 rounded-full transition-colors',
                    isDragging ? 'bg-ocean-200' : 'hover:bg-ocean-200'
                  )}
                />
              </div>
              <div className="flex w-full flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6 text-start">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex flex-col">
                    <TypographyH4 className="mt-4">{node?.fullName}</TypographyH4>
                    <p>{t_tree('node-info-description')} </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="hover:bg-ocean-200/15 rounded p-1 transition-colors duration-300"
                  >
                    <X size={24} className="text-ocean-200" />
                  </button>
                </div>
                {/* General Information Section */}
                <TypographyH5>{t_tree('node-general-info')}</TypographyH5>
                <div className="border-ocean-200/50 mb-2 flex-col items-start rounded border-2 bg-white px-3 py-2 text-left shadow-lg">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="w-fit">
                        <FormLabel>{t_tree('node-fullname')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Input
                              {...field}
                              autoComplete="off"
                              className="w-fit"
                              placeholder={t_tree('node-fullname')}
                              disabled={!editMode || loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t_tree('node-birth-date')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Input
                              {...field}
                              className="w-fit"
                              value={
                                field.value ? new Date(field.value).toISOString().split('T')[0] : ''
                              }
                              onChange={(e) =>
                                field.onChange(e.target.value ? new Date(e.target.value) : null)
                              }
                              type="date"
                              autoComplete="off"
                              placeholder={t_tree('node-birth-date')}
                              disabled={!editMode || loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deathDate"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel>{t_tree('node-death-date')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Input
                              {...field}
                              className="w-fit"
                              value={
                                field.value ? new Date(field.value).toISOString().split('T')[0] : ''
                              }
                              onChange={(e) =>
                                field.onChange(e.target.value ? new Date(e.target.value) : null)
                              }
                              type="date"
                              autoComplete="off"
                              placeholder={t_tree('node-death-date')}
                              disabled={!editMode || loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t_tree('node-gender')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ''}
                              disabled={!editMode || loading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={'-'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">{t_tree('node-gender-male')}</SelectItem>
                                <SelectItem value="FEMALE">
                                  {t_tree('node-gender-female')}
                                </SelectItem>
                                <SelectItem value="OTHER">{t_tree('node-gender-other')}</SelectItem>
                                <SelectItem value="UNSPECIFIED">
                                  {t_tree('node-gender-unspecified')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  {!editMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditMode(true)}
                      disabled={loading}
                    >
                      <span className="text-sm font-bold">{t_tree('node-info-edit')}</span>
                    </Button>
                  )}
                  {editMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditMode(false)}
                      disabled={loading}
                    >
                      <span className="text-sm font-bold">{t_common('cancel')}</span>
                    </Button>
                  )}
                  {editMode && (
                    <Button
                      type="submit"
                      disabled={
                        loading ||
                        (fullName === node?.fullName &&
                          (birthDate ? new Date(birthDate).toISOString() : '') ===
                            (node?.birthDate ? new Date(node.birthDate).toISOString() : '') &&
                          (deathDate ? new Date(deathDate).toISOString() : '') ===
                            (node?.deathDate ? new Date(node.deathDate).toISOString() : '') &&
                          gender === node?.gender)
                      }
                    >
                      <div className="flex items-center space-x-3">
                        {loading && <LoaderIcon size={16} className="animate-spin" />}
                        <span className="text-sm font-bold">
                          {loading ? t_common('updating') : t_common('update')}
                        </span>
                      </div>
                    </Button>
                  )}
                </div>
                {editMode && (
                  <div className="mt-auto self-start">
                    <Button type="button" variant="ghost" onClick={onDelete} disabled={loading}>
                      <span className="text-sm font-bold">{t_toasts('node-delete')}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  )
}
