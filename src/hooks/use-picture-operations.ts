'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getImageAssetUrl, publicImagesEnabled } from '@/config/images'

import {
  createPicture,
  createPictureTag,
  deletePicture,
  deletePictureTag,
  getPictures,
  getTreeNodes,
  setProfilePictureTag,
} from '@/server/actions'

import { compressImage, getProfilePicture } from '@/utils'

import { Picture, TreeNode } from '@/types'

interface UsePictureOperationsOptions {
  showModal: boolean
  node: TreeNode | null
  t_errors: (key: string) => string
  t_toasts: (key: string) => string
}

export function usePictureOperations({
  showModal,
  node,
  t_errors,
  t_toasts,
}: UsePictureOperationsOptions) {
  const [pictures, setPictures] = useState<Picture[]>([])
  const [loadingPictures, setLoadingPictures] = useState(false)
  const [profilePicture, setProfilePicture] = useState<Picture | null>(null)
  const [errorProfilePicture, setErrorProfilePicture] = useState(false)
  const [errorGalleryPicture, setErrorGalleryPicture] = useState<{ [key: string]: boolean }>({})

  const [pictureDeleteDialogOpen, setPictureDeleteDialogOpen] = useState(false)

  const [showTagsModal, setShowTagsModal] = useState(false)
  const [tappedImageId, setTappedImageId] = useState<string | null>(null)
  const [selectedPicture, setSelectedPicture] = useState<Picture | null>(null)
  const [availableNodes, setAvailableNodes] = useState<
    Array<{ id: string; fullName: string; alias: string | null }>
  >([])

  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expandedPicture, setExpandedPicture] = useState<Picture | null>(null)

  const [pictureMenu, setPictureMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    picture: null as Picture | null,
  })

  /**
   * Fetch pictures when node changes and modal opens with gallery
   */
  useEffect(() => {
    if (showModal && node?.id) {
      setErrorProfilePicture(false)
      setErrorGalleryPicture({})

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
  }, [showModal, node?.id])

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
   * Effect to clear tapped image highlight after 1500ms
   */
  useEffect(() => {
    if (tappedImageId) {
      const timer = setTimeout(() => setTappedImageId(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [tappedImageId])

  /**
   * Expand picture to fullscreen
   * @param picture {Picture} - The picture to expand
   */
  const onPictureExpand = (picture: Picture) => setExpandedPicture(picture)

  /**
   * Shrink picture from fullscreen
   */
  const onPictureShrink = () => setExpandedPicture(null)

  /**
   * Open picture menu
   * @param e {React.MouseEvent} - The mouse event
   * @param picture {Picture} - The picture to open menu for
   */
  const onPictureMenuOpen = (e: React.MouseEvent, picture: Picture) => {
    e.preventDefault()
    setPictureMenu({ visible: true, x: e.clientX, y: e.clientY, picture })
  }

  /**
   * Close picture menu
   */
  const onPictureMenuClose = () => setPictureMenu((prev) => ({ ...prev, visible: false }))

  /**
   * Download picture
   * @param fileKey {string} - The file key of the picture to download
   */
  const onPictureDownload = useCallback(
    (fileKey: string) => {
      try {
        const href = getImageAssetUrl(fileKey)
        if (!href) return toast.error(t_errors('error-pictures-disabled'))

        const element = document.createElement('a')
        element.style.display = 'none'
        element.href = href
        element.download = fileKey.split('/').pop() || 'image.jpg'
        element.target = '_blank'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      } catch (e) {
        toast.error(t_errors('error'))
      }
    },
    [t_errors]
  )

  /**
   * Edit picture tags
   * @param picture {Picture} - The picture to edit tags for
   */
  const onPictureTags = useCallback(
    async (picture: Picture) => {
      if (!node) return
      setSelectedPicture(picture)
      setShowTagsModal(true)

      try {
        const nodes = await getTreeNodes(node.treeId)
        const taggedNodeIds = picture.tags?.map((tag) => tag.nodeId) || []
        const available = nodes
          .filter((node) => !taggedNodeIds.includes(node.id))
          .map((n) => ({ id: n.id, fullName: n.fullName, alias: n.alias || null }))
        setAvailableNodes(available)
      } catch (error) {
        toast.error(t_errors('error'))
      }
    },
    [node, t_errors]
  )

  /**
   * Add tag to picture
   * @param pictureId {string} - The picture to add tag to
   * @param nodeId {string} - The node id of the tag to add
   */
  const onAddTag = useCallback(
    async (pictureId: string, nodeId: string) => {
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
    },
    [selectedPicture, t_errors, t_toasts]
  )

  /**
   * Remove tag from picture
   * @param pictureId {string} - The picture to remove tag from
   * @param tagId {string} - The tag id of the tag to remove
   */
  const onRemoveTag = useCallback(
    async (pictureId: string, tagId: string) => {
      if (!selectedPicture) return

      try {
        const tagToRemove = selectedPicture.tags?.find((t) => t.id === tagId)
        if (!tagToRemove) return

        const { error, message } = await deletePictureTag(
          pictureId,
          tagToRemove.nodeId,
          node?.id ?? ''
        )
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
            {
              id: tagToRemove.nodeId,
              fullName: tagToRemove.node!.fullName,
              alias: tagToRemove.node!.alias,
            },
          ])

        toast.success(t_toasts('node-picture-tag-removed'))
      } catch (error) {
        toast.error(t_errors('error'))
      }
    },
    [selectedPicture, node, t_errors, t_toasts]
  )

  /**
   * Deletes the picture and its tags
   * @param pictureId {string} - The picture to delete
   */
  const onPictureDelete = useCallback(
    async (pictureId: string) => {
      try {
        const { error, message } = await deletePicture(pictureId)
        if (error) return toast.error(t_errors(message || 'error'))

        setPictures((prev) => prev.filter((pic) => pic.id !== pictureId))
        toast.success(t_toasts('node-picture-deleted'))
      } catch (error) {
        toast.error(t_errors('error'))
      }
    },
    [t_errors, t_toasts]
  )

  /**
   * Sets the picture as profile picture for the node
   * @param pictureId {string} - The picture to set as profile
   */
  const onPictureProfile = useCallback(
    async (pictureId: string) => {
      try {
        if (!node) return
        const { error, message } = await setProfilePictureTag(pictureId, node.id)
        if (error) return toast.error(t_errors(message || 'error'))

        const newProfilePicture = pictures.find((pic) => pic.id === pictureId) || null
        setProfilePicture(newProfilePicture)
        toast.success(t_toasts('node-picture-profile-set'))
      } catch (error) {
        toast.error(t_errors('error'))
      }
    },
    [node, pictures, t_errors, t_toasts]
  )

  /**
   * Handle file input change for picture upload
   * @param e {React.ChangeEvent<HTMLInputElement>}
   * @returns Promise<void>
   */
  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!publicImagesEnabled) {
        toast.error(t_errors('error-pictures-disabled'))
        return
      }

      setLoading(true)
      try {
        if (!node) return
        const compressed = await compressImage(file)
        const result = await createPicture(node.id, compressed)

        if (!result.error && result.picture) {
          setPictures((prev) => [result.picture!, ...prev])
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
    },
    [node, t_errors, t_toasts]
  )

  /**
   * Set error state for gallery picture
   * @param pictureId {string} - The picture id to set error for
   */
  const setGalleryPictureError = useCallback((pictureId: string) => {
    setErrorGalleryPicture((prev) => ({ ...prev, [pictureId]: true }))
  }, [])

  return {
    pictures,
    loadingPictures,
    profilePicture,
    errorProfilePicture,
    setErrorProfilePicture,
    errorGalleryPicture,
    setGalleryPictureError,
    pictureDeleteDialogOpen,
    setPictureDeleteDialogOpen,
    showTagsModal,
    setShowTagsModal,
    tappedImageId,
    setTappedImageId,
    selectedPicture,
    availableNodes,
    loading,
    setLoading,
    fileInputRef,
    expandedPicture,
    onPictureExpand,
    onPictureShrink,
    pictureMenu,
    onPictureMenuOpen,
    onPictureMenuClose,
    onPictureDownload,
    onPictureTags,
    onAddTag,
    onRemoveTag,
    onPictureDelete,
    onPictureProfile,
    onFileChange,
  }
}
