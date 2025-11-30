'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Image, LoaderIcon, Menu, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'
import * as Tabs from '@radix-ui/react-tabs'

import { UpdateTreeNodeSchema } from '@/server/schemas'
import {
  createPicture,
  createPictureTag,
  deletePicture,
  deletePictureTag,
  getPictures,
  getTreeNodes,
  setProfilePictureTag,
} from '@/server/actions'

import { PictureContextMenu } from '@/components/tree/ui'
import {
  Button,
  ConfirmDialog,
  Form,
  FormControl,
  FormDescription,
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
  Textarea,
  TypographyH4,
  TypographyH5,
} from '@/ui'

import { checkKeyDown, cn, getProfilePicture } from '@/utils'

import { Picture, TreeNode } from '@/types'

interface NodeInfoModalProps {
  showModal: boolean
  node: TreeNode | null
  withPicture?: boolean
  withGallery?: boolean
  form: UseFormReturn<z.infer<typeof UpdateTreeNodeSchema>>
  onUpdate: (values: z.infer<typeof UpdateTreeNodeSchema>) => Promise<void>
  onClose: () => void
  onDelete: () => void
}

export function NodeInfoModal({
  showModal,
  node,
  withPicture,
  withGallery,
  form,
  onUpdate,
  onClose,
  onDelete,
}: NodeInfoModalProps) {
  const t_common = useTranslations('common')
  const t_trees = useTranslations('trees')
  const t_errors = useTranslations('errors')
  const t_toasts = useTranslations('toasts')

  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)

  /**
   * Picture-related states
   */
  const [pictures, setPictures] = useState<Picture[]>([])
  const [currentTab, setCurrentTab] = useState<'general' | 'gallery'>('general')
  const [loadingPictures, setLoadingPictures] = useState(false)
  const [profilePicture, setProfilePicture] = useState<Picture | null>(null)
  const [errorProfilePicture, setErrorProfilePicture] = useState(false)
  const [errorGalleryPicture, setErrorGalleryPicture] = useState<{ [key: string]: boolean }>({})

  const [pictureDeleteDialogOpen, setPictureDeleteDialogOpen] = useState(false)

  const [showTagsModal, setShowTagsModal] = useState(false)
  const [tappedImageId, setTappedImageId] = useState<string | null>(null)
  const [selectedPicture, setSelectedPicture] = useState<Picture | null>(null)
  const [availableNodes, setAvailableNodes] = useState<Array<{ id: string; fullName: string }>>([])

  const [modalHeight, setModalHeight] = useState(90)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startHeight: 0 })

  const fullName = form.watch('fullName')
  const birthPlace = form.watch('birthPlace')
  const birthDate = form.watch('birthDate')
  const deathDate = form.watch('deathDate')
  const gender = form.watch('gender')
  const biography = form.watch('biography')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pictureMenu, setPictureMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    picture: null as any | null,
  })

  function openPictureMenu(e: React.MouseEvent, picture: any) {
    e.preventDefault()
    setPictureMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      picture,
    })
  }

  function closePictureMenu() {
    setPictureMenu((prev) => ({ ...prev, visible: false }))
  }

  /**
   * Handle form submission
   */
  const submit = form.handleSubmit(async (values) => {
    setLoading(true)
    await onUpdate(values)
    setLoading(false)
  })

  /**
   * Fetch pictures when node changes and modal opens with gallery
   */
  useEffect(() => {
    if (showModal && withGallery && node?.id) {
      const fetchPictures = async () => {
        setLoadingPictures(true)
        try {
          const data = await getPictures(node.id)
          setPictures(data)
        } catch (error) {
          setPictures([])
        } finally {
          setLoadingPictures(false)
        }
      }

      fetchPictures()
    }
  }, [showModal, withGallery, node?.id])

  /**
   * Effect to update profile picture when node or pictures change
   */
  useEffect(() => {
    if (node && pictures.length > 0) {
      setProfilePicture(getProfilePicture(node))
    } else {
      setProfilePicture(null)
    }
  }, [node, pictures])

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

  /**
   * Effect to clear tapped image highlight after 1500ms
   */
  useEffect(() => {
    if (tappedImageId) {
      const timer = setTimeout(() => setTappedImageId(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [tappedImageId])

  /**
   * Download picture
   * @param fileKey {string} - The file key of the picture to download
   */
  const onPictureDownload = (fileKey: string) => {
    try {
      const element = document.createElement('a')
      element.style.display = 'none'
      element.href = `${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${fileKey}`
      element.download = fileKey.split('/').pop() || 'image.jpg'
      element.target = '_blank'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (e) {
      toast.error(t_errors('error'))
    }
  }

  /**
   * Edit picture tags
   * @param picture {Picture} - The picture to edit tags for
   */
  const onPictureTags = async (picture: Picture) => {
    setSelectedPicture(picture)
    setShowTagsModal(true)

    try {
      const nodes = await getTreeNodes(node?.treeId!)
      const taggedNodeIds = picture.tags?.map((tag) => tag.nodeId) || []
      const available = nodes
        .filter((node) => !taggedNodeIds.includes(node.id))
        .map((n) => ({ id: n.id, fullName: n.fullName }))
      setAvailableNodes(available)
    } catch (error) {
      toast.error(t_errors('error'))
    }
  }

  /**
   * Add tag to picture
   * @param pictureId {string} - The picture to add tag to
   * @param nodeId {string} - The node id of the tag to add
   */
  const onAddTag = async (pictureId: string, nodeId: string) => {
    if (!selectedPicture) return

    try {
      const { error, message, tag } = await createPictureTag(pictureId, nodeId)
      if (error || !tag) return toast.error(t_errors(message || 'error-tag-create'))

      setSelectedPicture({
        ...selectedPicture,
        tags: [...(selectedPicture.tags || []), tag],
      })

      setPictures((prev) =>
        prev.map((pic) =>
          pic.id === pictureId ? { ...pic, tags: [...(pic.tags || []), tag] } : pic
        )
      )

      setAvailableNodes((prev) => prev.filter((n) => n.id !== nodeId))

      toast.success(t_toasts('node-picture-tag-added'))
    } catch (error) {
      toast.error(t_errors('error'))
    }
  }

  /**
   * Remove tag from picture
   * @param pictureId {string} - The picture to remove tag from
   * @param tagId {string} - The tag id of the tag to remove
   */
  const onRemoveTag = async (pictureId: string, tagId: string) => {
    if (!selectedPicture) return

    try {
      const tagToRemove = selectedPicture.tags?.find((t) => t.id === tagId)
      if (!tagToRemove) return

      const { error, message } = await deletePictureTag(pictureId, tagToRemove.nodeId, node!.id)
      if (error) return toast.error(t_errors(message || 'error-tag-remove'))

      const updatedTags = selectedPicture.tags?.filter((t) => t.id !== tagId) || []
      setSelectedPicture({ ...selectedPicture, tags: updatedTags })

      setPictures((prev) =>
        prev.map((pic) =>
          pic.id === pictureId ? { ...pic, tags: pic.tags?.filter((t) => t.id !== tagId) } : pic
        )
      )

      if (tagToRemove.node)
        setAvailableNodes((prev) => [
          ...prev,
          { id: tagToRemove.nodeId, fullName: tagToRemove.node!.fullName },
        ])

      toast.success(t_toasts('node-picture-tag-removed'))
    } catch (error) {
      toast.error(t_errors('error'))
    }
  }

  /**
   * Deletes the picture and its tags
   * @param picture {string} - The picture to delete
   */
  const onPictureDelete = async (pictureId: string) => {
    try {
      const { error, message } = await deletePicture(pictureId)
      if (error) return toast.error(t_errors(message || 'error'))

      setPictures((prev) => prev.filter((pic) => pic.id !== pictureId))
      toast.success(t_toasts('node-picture-deleted'))
    } catch (error) {
      toast.error(t_errors('error'))
    }
  }

  /**
   * Sets the picture as profile picture for the node
   * @param pictureId {string} - The picture to set as profile
   */
  const onPictureProfile = async (pictureId: string) => {
    try {
      const { error, message } = await setProfilePictureTag(pictureId, node!.id)
      if (error) return toast.error(t_errors(message || 'error'))

      const newProfilePicture = pictures.find((pic) => pic.id === pictureId) || null
      setProfilePicture(newProfilePicture)
      toast.success(t_toasts('node-picture-profile-set'))
    } catch (error) {
      toast.error(t_errors('error'))
    }
  }

  /**
   * Handle file input change for picture upload
   * @param e {React.ChangeEvent<HTMLInputElement>}
   * @returns Promise<void>
   */
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const result = await createPicture(node!.id, file)

      if (!result.error && result.picture) {
        setPictures([result.picture, ...pictures])
        toast.success(t_toasts('node-picture-uploaded'))
      } else if (result.error) {
        toast.error(t_errors(result.message || 'error'))
      }
    } catch (error) {
      toast.error(t_errors('error-picture-upload'))
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div
        className={cn(
          'bg-ocean-500/50 fixed inset-0 z-30 backdrop-blur-xs transition-opacity duration-300',
          showModal ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <Tabs.Root
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value as 'general' | 'gallery')}
      >
        <div
          className={cn(
            'text-ocean-400 fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out',
            'sm:top-0 sm:left-0 sm:h-full sm:w-2/5',
            isDragging && 'transition-none',
            showModal
              ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0'
              : 'translate-y-full sm:-translate-x-full sm:translate-y-0',
            !showModal && withGallery && 'sm:delay-400'
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
              <div
                className={cn(
                  'bg-pale-ocean border-ocean-200 flex h-full flex-col',
                  'shadow-2l overflow-hidden sm:flex sm:flex-row',
                  isMobile && 'border-t-8'
                )}
              >
                <div
                  className="flex shrink-0 cursor-row-resize justify-center pt-3 pb-2 select-none sm:hidden"
                  onMouseDown={handleDragStart}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    handleDragStart(e)
                  }}
                >
                  <div
                    className={cn(
                      'bg-ocean-100 h-1.5 w-12 rounded-full transition-colors',
                      isDragging ? 'bg-ocean-200' : 'hover:bg-ocean-200'
                    )}
                  />
                </div>
                <div
                  className={cn(
                    'styled-scrollbar flex w-full flex-1 flex-col',
                    'overflow-y-auto px-6 pt-2 pb-6 text-start'
                  )}
                  style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                >
                  <div className="my-4 flex flex-col items-start gap-x-3 gap-y-2">
                    <div className="flex w-full items-center space-x-3">
                      {withPicture && (
                        <div
                          className={cn(
                            'shadow-center relative flex h-24 w-24 shrink-0 items-center justify-center',
                            'bg-ocean-50 border-ocean-300 text-ocean-300 rounded-lg border-4'
                          )}
                        >
                          {profilePicture && !errorProfilePicture && (
                            <img
                              className="h-full w-full rounded-lg object-cover"
                              src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${profilePicture?.fileKey!}`}
                              alt="Profile picture"
                              onError={(_) => setErrorProfilePicture(true)}
                            />
                          )}
                          {(errorProfilePicture || !profilePicture) && (
                            <div className="flex h-full w-full items-center justify-center rounded-lg">
                              <Image size={48} />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex flex-1 items-center">
                        <TypographyH4>{node?.fullName}</TypographyH4>
                      </div>
                      {!withGallery && (
                        <button
                          onClick={onClose}
                          type="button"
                          className="hover:bg-ocean-200/15 self-start rounded p-1 transition-colors duration-300"
                        >
                          <X size={24} className="text-ocean-200" />
                        </button>
                      )}
                    </div>
                    <p>{t_trees('node-info-description')} </p>
                  </div>
                  <Tabs.List className="border-ocean-200/50 mb-4 flex border-b-2 sm:hidden">
                    <Tabs.Trigger
                      value="general"
                      className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-black"
                    >
                      {t_trees('node-general-info')}
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="gallery"
                      disabled={!withGallery}
                      className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-black"
                    >
                      {t_trees('node-gallery')}
                    </Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="general">
                    {!isMobile && <TypographyH5>{t_trees('node-general-info')}</TypographyH5>}
                    <div className="border-ocean-200/50 shadow-center mb-2 flex-col items-start rounded-lg border-2 bg-white px-3 py-2 text-left">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="w-fit">
                            <FormLabel>{t_trees('node-fullname')}</FormLabel>
                            <FormControl>
                              <div className="py-2">
                                <Input
                                  {...field}
                                  autoComplete="off"
                                  placeholder={t_trees('node-fullname')}
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
                        name="birthPlace"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t_trees('node-birth-place')}</FormLabel>
                            <FormControl>
                              <div className="py-2">
                                <Input
                                  {...field}
                                  value={field.value ?? ''}
                                  autoComplete="off"
                                  className="min-w-[16ch]"
                                  placeholder={t_trees('node-birth-place')}
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
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem className="mt-3">
                            <FormLabel>{t_trees('node-birth-date')}</FormLabel>
                            <FormControl>
                              <div className="py-2">
                                <Input
                                  {...field}
                                  className="w-fit"
                                  value={
                                    field.value
                                      ? new Date(field.value).toISOString().split('T')[0]
                                      : ''
                                  }
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? new Date(e.target.value) : null)
                                  }
                                  type="date"
                                  autoComplete="off"
                                  placeholder={t_trees('node-birth-date')}
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
                            <FormLabel>{t_trees('node-death-date')}</FormLabel>
                            <FormControl>
                              <div className="py-2">
                                <Input
                                  {...field}
                                  className="w-fit"
                                  value={
                                    field.value
                                      ? new Date(field.value).toISOString().split('T')[0]
                                      : ''
                                  }
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? new Date(e.target.value) : null)
                                  }
                                  type="date"
                                  autoComplete="off"
                                  placeholder={t_trees('node-death-date')}
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
                          <FormItem>
                            <FormLabel>{t_trees('node-gender')}</FormLabel>
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
                                    <SelectItem value="MALE">
                                      {t_trees('node-gender-male')}
                                    </SelectItem>
                                    <SelectItem value="FEMALE">
                                      {t_trees('node-gender-female')}
                                    </SelectItem>
                                    <SelectItem value="OTHER">
                                      {t_trees('node-gender-other')}
                                    </SelectItem>
                                    <SelectItem value="UNSPECIFIED">
                                      {t_trees('node-gender-unspecified')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                      <FormField
                        control={form.control}
                        name="biography"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t_trees('node-biography')}</FormLabel>
                            <FormDescription className="mb-2 text-sm opacity-70">
                              {t_trees('node-biography-description')}
                            </FormDescription>
                            <FormControl>
                              <div className="py-2">
                                <Textarea
                                  {...field}
                                  value={field.value || ''}
                                  autoComplete="off"
                                  className="min-w-[16ch]"
                                  disabled={!editMode || loading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="my-6 flex gap-3">
                      {!editMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditMode(true)}
                          disabled={loading}
                        >
                          <span className="text-sm font-bold">{t_trees('node-info-edit')}</span>
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
                              gender === node?.gender &&
                              birthPlace === node?.birthPlace &&
                              biography === node?.biography)
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
                  </Tabs.Content>
                  {isMobile && (
                    <Tabs.Content value="gallery">
                      <div
                        className={cn(
                          'bg-ocean-400 text-pale-ocean shadow-center h-full flex-col rounded-xl'
                        )}
                      >
                        <div className="styled-scrollbar flex w-full flex-1 flex-col overflow-y-auto px-6 pt-2 pb-6 text-start">
                          <div className="mt-4 mb-6 flex flex-col items-start gap-x-3 gap-y-2">
                            <p>{t_trees('node-gallery-description')} </p>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={loading}
                              className="hover:text-ocean-50 bg-ocean-300 mt-5 cursor-pointer self-center"
                            >
                              <span className="text-sm font-bold">
                                {t_trees('node-gallery-upload')}
                              </span>
                            </Button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onFileChange}
                            className="hidden"
                          />
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
                                    setTappedImageId(
                                      tappedImageId === picture.id ? null : picture.id
                                    )
                                  }
                                >
                                  {!errorGalleryPicture[picture.id] ? (
                                    <img
                                      className="min-h-[124px] w-full rounded-lg object-cover"
                                      src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${picture.fileKey}`}
                                      alt={`Picture ${idx + 1}`}
                                      onError={(_) =>
                                        setErrorGalleryPicture((prev) => ({
                                          ...prev,
                                          [picture.id]: true,
                                        }))
                                      }
                                    />
                                  ) : (
                                    <div className="flex min-h-[124px] items-center justify-center rounded-lg">
                                      <Image size={48} />
                                    </div>
                                  )}
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
                                      onClick={(e) => openPictureMenu(e, picture)}
                                      className="bg-pale-ocean text-ocean-400 shadow-center cursor-pointer rounded-lg p-2 transition-all duration-200"
                                    >
                                      <Menu size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Tabs.Content>
                  )}
                </div>
                {!isMobile && (
                  <div
                    className={cn('bg-ocean-200 w-2 self-center', withGallery ? 'h-3/5' : 'h-full')}
                  />
                )}
              </div>
            </form>
          </Form>
        </div>
        {!isMobile && withGallery && (
          <div
            className={cn(
              'text-pale-ocean fixed inset-x-0 bottom-0 z-40 transition-transform duration-400 ease-linear',
              'sm:top-0 sm:left-0 sm:h-full sm:w-5/6',
              isDragging && 'transition-none',
              showModal
                ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0 sm:delay-200'
                : 'translate-y-full sm:-translate-x-full sm:translate-y-0'
            )}
            style={{ height: '100vh', paddingLeft: '40%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'bg-ocean-400 h-full flex-col',
                'shadow-2l overflow-hidden sm:flex sm:flex-row',
                'border-ocean-500 border-r-8'
              )}
            >
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="hover:text-ocean-50 bg-ocean-300 mt-5 cursor-pointer self-center"
                  >
                    <span className="text-sm font-bold">{t_trees('node-gallery-upload')}</span>
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
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
                          'group shadow-center relative mb-2 shrink-0 cursor-pointer break-inside-avoid',
                          'bg-ocean-300 text-ocean-200 rounded-lg'
                        )}
                      >
                        {!errorGalleryPicture[picture.id] ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${picture.fileKey}`}
                            alt={`Picture ${idx + 1}`}
                            onError={(_) =>
                              setErrorGalleryPicture((prev) => ({
                                ...prev,
                                [picture.id]: true,
                              }))
                            }
                            className="shadow-center bg-ocean-300 mb-2 min-h-[124px] w-full rounded-lg object-cover transition-opacity duration-300"
                          />
                        ) : (
                          <div className="flex min-h-[124px] items-center justify-center rounded-lg">
                            <Image size={48} />
                          </div>
                        )}
                        <div className="bg-ocean-500 pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
                        <div
                          className={cn(
                            'pointer-events-none absolute top-0 right-0 mt-2 mr-2 flex items-end justify-center gap-2 rounded opacity-0',
                            'transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100'
                          )}
                        >
                          <button
                            type="button"
                            onClick={(e) => openPictureMenu(e, picture)}
                            className="bg-pale-ocean text-ocean-400 shadow-center cursor-pointer rounded-lg p-2 transition-all duration-200"
                          >
                            <Menu size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Tabs.Root>
      <PictureContextMenu
        visible={pictureMenu.visible}
        x={pictureMenu.x}
        y={pictureMenu.y}
        picture={pictureMenu.picture}
        onDownload={onPictureDownload}
        onTags={onPictureTags}
        onDelete={() => setPictureDeleteDialogOpen(true)}
        onSetProfile={onPictureProfile}
        profilePictureId={profilePicture?.id}
        onClose={closePictureMenu}
      />
      <ConfirmDialog
        open={pictureDeleteDialogOpen}
        title={t_toasts('node-picture-delete-confirm')}
        description={t_toasts('node-picture-delete-confirm-description')}
        onCancel={() => setPictureDeleteDialogOpen(false)}
        onConfirm={() => {
          if (pictureMenu.picture) onPictureDelete(pictureMenu.picture.id)
          setPictureDeleteDialogOpen(false)
        }}
      />
      {showTagsModal && selectedPicture && (
        <>
          <div
            className="bg-ocean-500/50 fixed inset-0 z-60 backdrop-blur-xs"
            onClick={() => setShowTagsModal(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 z-60 w-full max-w-5/6 -translate-x-1/2 -translate-y-1/2 transform sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-pale-ocean text-ocean-400 shadow-center rounded-xl">
              <div className="border-ocean-100 flex items-center justify-between border-b-4 px-6 py-4">
                <TypographyH5>{t_trees('node-gallery-tags')}</TypographyH5>
                <button
                  onClick={() => setShowTagsModal(false)}
                  className="hover:bg-ocean-200/15 rounded p-1 transition-colors"
                >
                  <X size={20} className="text-ocean-200" />
                </button>
              </div>

              <div className="styled-scrollbar max-h-96 overflow-y-auto px-6 py-4">
                {selectedPicture.tags && selectedPicture.tags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-ocean-300 mb-2 text-sm font-bold">
                      {t_trees('node-gallery-tags-currently')}
                    </p>
                    <div className="text-ocean-200 space-y-2">
                      {selectedPicture.tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="border-ocean-100 bg-ocean-50 flex items-center justify-between rounded-lg border-2 px-3 py-2"
                        >
                          <span className="text-sm font-medium">{tag.node?.fullName}</span>
                          <button
                            onClick={() => onRemoveTag(selectedPicture.id, tag.id)}
                            className="hover:bg-ocean-200/15 rounded transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {availableNodes.length > 0 && (
                  <div>
                    <p className="text-ocean-300 mb-2 text-sm font-bold">
                      {t_trees('node-gallery-tags-add')}
                    </p>
                    <div className="text-ocean-200 space-y-2">
                      {availableNodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => onAddTag(selectedPicture.id, node.id)}
                          className="border-ocean-100 hover:bg-ocean-50 bg-pale-ocean flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors"
                        >
                          <span className="text-sm">{node.fullName}</span>
                          <Plus size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(!selectedPicture.tags || selectedPicture.tags.length === 0) &&
                  availableNodes.length === 0 && (
                    <p className="text-ocean-300/70 py-8 text-center text-sm">
                      {t_trees('node-gallery-tags-add-none')}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
