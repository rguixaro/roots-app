'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { type z } from 'zod'
import * as Tabs from '@radix-ui/react-tabs'

import { UpdateTreeNodeSchema } from '@/server/schemas'

import { useMobileDrag, usePictureOperations } from '@/hooks'

import { PictureContextMenu } from '@/components/tree/context'
import { NodeInfoTabGeneral } from '@/components/tree/modal'
import { ModalBackdrop } from '@/components/tree/modal'

import {
  ProfilePictureDisplay,
  NodeGalleryContent,
  PictureTagsModal,
} from '@/components/tree/pictures'

import { ConfirmDialog, Form, TypographyH4 } from '@/ui'

import { checkKeyDown, cn } from '@/utils'

import { TreeNode } from '@/types'

interface NodeInfoModalProps {
  readonly: boolean
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
  readonly,
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

  const [formLoading, setFormLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentTab, setCurrentTab] = useState<'general' | 'gallery'>('general')
  const [displayNode, setDisplayNode] = useState<TreeNode | null>(null)

  const { modalHeight, isDragging, isMobile, handleDragStart } = useMobileDrag()

  const pictureOps = usePictureOperations({
    showModal,
    withGallery,
    node,
    t_errors,
    t_toasts,
  })

  /**
   * Handle form submission
   */
  const submit = form.handleSubmit(async (values) => {
    setFormLoading(true)
    await onUpdate(values)
    setFormLoading(false)
  })

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
   * Effect to store node data when modal opens (keeps it visible during close animation)
   */
  useEffect(() => {
    if (showModal && node) {
      setDisplayNode(node)
    }
  }, [showModal, node])

  /**
   * Effect to reset form when modal is closed
   */
  useEffect(() => {
    if (!showModal) {
      form.reset()
      setEditMode(false)
      setFormLoading(false)
      const timeout = setTimeout(() => setDisplayNode(null), 500)
      return () => clearTimeout(timeout)
    }
  }, [showModal, form])

  const loading = formLoading || pictureOps.loading

  return (
    <>
      <ModalBackdrop show={showModal} onClick={onClose} />
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
                        <ProfilePictureDisplay
                          profilePicture={pictureOps.profilePicture}
                          errorProfilePicture={pictureOps.errorProfilePicture}
                          onError={() => pictureOps.setErrorProfilePicture(true)}
                        />
                      )}
                      <div className="flex flex-1 items-center">
                        <TypographyH4>{displayNode?.fullName}</TypographyH4>
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
                      className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-bold"
                    >
                      {t_trees('node-general-info')}
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="gallery"
                      disabled={!withGallery}
                      className="border-ocean-100 text-ocean-300 px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:font-bold"
                    >
                      {t_trees('node-gallery')}
                    </Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="general">
                    <NodeInfoTabGeneral
                      readonly={readonly}
                      node={node}
                      form={form}
                      loading={loading}
                      editMode={editMode}
                      isMobile={isMobile}
                      onEditModeChange={setEditMode}
                      onDelete={onDelete}
                      t_common={t_common}
                      t_trees={t_trees}
                      t_toasts={t_toasts}
                    />
                  </Tabs.Content>
                  {isMobile && (
                    <Tabs.Content value="gallery">
                      <NodeGalleryContent
                        readonly={readonly}
                        pictures={pictureOps.pictures}
                        loadingPictures={pictureOps.loadingPictures}
                        loading={loading}
                        errorGalleryPicture={pictureOps.errorGalleryPicture}
                        tappedImageId={pictureOps.tappedImageId}
                        isMobile={isMobile}
                        fileInputRef={pictureOps.fileInputRef}
                        onFileChange={pictureOps.onFileChange}
                        onTappedImageChange={pictureOps.setTappedImageId}
                        onPictureMenuOpen={pictureOps.openPictureMenu}
                        onGalleryPictureError={pictureOps.setGalleryPictureError}
                        t_trees={t_trees}
                      />
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
              <NodeGalleryContent
                readonly={readonly}
                pictures={pictureOps.pictures}
                loadingPictures={pictureOps.loadingPictures}
                loading={loading}
                errorGalleryPicture={pictureOps.errorGalleryPicture}
                tappedImageId={pictureOps.tappedImageId}
                isMobile={isMobile}
                fileInputRef={pictureOps.fileInputRef}
                onFileChange={pictureOps.onFileChange}
                onTappedImageChange={pictureOps.setTappedImageId}
                onPictureMenuOpen={pictureOps.openPictureMenu}
                onGalleryPictureError={pictureOps.setGalleryPictureError}
                onClose={onClose}
                t_trees={t_trees}
              />
            </div>
          </div>
        )}
      </Tabs.Root>
      <PictureContextMenu
        visible={pictureOps.pictureMenu.visible}
        x={pictureOps.pictureMenu.x}
        y={pictureOps.pictureMenu.y}
        readonly={readonly}
        picture={pictureOps.pictureMenu.picture}
        onDownload={pictureOps.onPictureDownload}
        onTags={pictureOps.onPictureTags}
        onDelete={() => pictureOps.setPictureDeleteDialogOpen(true)}
        onSetProfile={pictureOps.onPictureProfile}
        profilePictureId={pictureOps.profilePicture?.id}
        onClose={pictureOps.closePictureMenu}
      />
      <ConfirmDialog
        open={pictureOps.pictureDeleteDialogOpen}
        title={t_toasts('node-picture-delete-confirm')}
        description={t_toasts('node-picture-delete-confirm-description')}
        onCancel={() => pictureOps.setPictureDeleteDialogOpen(false)}
        onConfirm={() => {
          if (pictureOps.pictureMenu.picture)
            pictureOps.onPictureDelete(pictureOps.pictureMenu.picture.id)
          pictureOps.setPictureDeleteDialogOpen(false)
        }}
      />
      {pictureOps.showTagsModal && pictureOps.selectedPicture && (
        <PictureTagsModal
          show={pictureOps.showTagsModal}
          selectedPicture={pictureOps.selectedPicture}
          availableNodes={pictureOps.availableNodes}
          onClose={() => pictureOps.setShowTagsModal(false)}
          onAddTag={pictureOps.onAddTag}
          onRemoveTag={pictureOps.onRemoveTag}
          t_trees={t_trees}
        />
      )}
    </>
  )
}
