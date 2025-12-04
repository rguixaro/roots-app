'use client'

import { useState, useCallback, JSX, useEffect } from 'react'
import { Position, Handle, NodeProps } from 'reactflow'
import { Info, Image, LoaderIcon } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

import { cn, getProfilePicture } from '@/utils'

import { TreeNode } from '@/types'

interface StyledNodeProps {
  node: TreeNode
  withPicture?: boolean
  selectedNodeId: string | null
  onInfo: (node: TreeNode) => void
  collapseKey?: number
}

/**
 * Global styles for node handles
 */
const NodeHandlesGlobalStyles =
  'h-px! w-px! rounded-xl! border-3! border-pale-ocean! opacity-0 transition-all duration-200 bg-pale-ocean!'

/**
 * Animation variants for the main node container
 */
const nodeContainerVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: {
    scale: 0.98,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
}

/**
 * Animation variants for the top expanding section (picture)
 */
const topExpandVariants: Variants = {
  collapsed: {
    scaleY: 0,
    opacity: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  expanded: {
    scaleY: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 },
  },
}

/**
 * Animation variants for the bottom expanding section (info button)
 */
const bottomExpandVariants: Variants = {
  collapsed: {
    scaleY: 0,
    opacity: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  expanded: {
    scaleY: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25, mass: 0.8, delay: 0.05 },
  },
}

/**
 * Animation variants for the picture content inside
 */
const pictureContentVariants: Variants = {
  collapsed: { opacity: 0, y: 10, scale: 0.9 },
  expanded: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, delay: 0.1 },
  },
}

/**
 * Animation variants for picture hover effect
 */
const pictureHoverVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.08,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
}

/**
 * Animation variants for the info icon with bounce
 */
const infoIconVariants: Variants = {
  collapsed: { opacity: 0, scale: 0.5 },
  expanded: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15, delay: 0.15 },
  },
}

/**
 * Animation variants for loader pulse
 */
const loaderPulseVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

/**
 * Handle animation variants with staggered delays
 */
const createHandleVariants = (delay: number): Variants => ({
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 500, damping: 25, delay },
  },
})

const handleVariants = {
  right: createHandleVariants(0),
  left: createHandleVariants(0.1),
  top: createHandleVariants(0.2),
  bottom: createHandleVariants(0.3),
}

/**
 * A styled node in the tree.
 * @param param0 {NodeProps<StyledNodeProps>}
 * @returns {JSX.Element}
 */
export function StyledNode({ data }: NodeProps<StyledNodeProps>): JSX.Element {
  const [isExpanded, setIsExpand] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isInModal, setIsInModal] = useState(false)
  const [isPictureLoading, setIsPictureLoading] = useState(true)
  const [pictureError, setPictureError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  const { id, fullName, birthDate, deathDate, edgesFrom, edgesTo } = data.node
  const { withPicture, selectedNodeId } = data

  const profilePicture = getProfilePicture(data.node)

  useEffect(() => {
    setIsInModal(selectedNodeId === id)
  }, [selectedNodeId, id])

  /**
   * Trigger mount animation for connected handles
   */
  useEffect(() => {
    const timer = setTimeout(() => setHasMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  /**
   * Detect mobile viewport
   */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  /**
   * Reset picture loading state when profile picture changes
   * If there's no picture, immediately set loading to false
   */
  useEffect(() => {
    if (profilePicture) {
      setIsPictureLoading(true)
      setPictureError(false)
    } else {
      setIsPictureLoading(false)
    }
  }, [profilePicture])

  /**
   * Handle picture load event
   */
  const handlePictureLoad = useCallback(() => setIsPictureLoading(false), [])

  /**
   * Handle picture error event
   */
  const handlePictureError = useCallback(() => {
    setIsPictureLoading(false)
    setPictureError(true)
  }, [])

  const showPicturePlaceholder = (!profilePicture || pictureError) && !isPictureLoading
  const showPictureLoader = isPictureLoading && !pictureError

  const birthYear = birthDate ? birthDate.getFullYear() : null
  const deathYear = deathDate ? deathDate.getFullYear() : null

  /**
   * Utility booleans to determine which handles have connections
   */
  const hasTopConnection = edgesTo?.some((e) => e.type === 'PARENT' || e.type === 'CHILD')
  const hasBottomConnection = edgesFrom?.some((e) => e.type === 'PARENT' || e.type === 'CHILD')
  const hasLeftConnection = edgesTo?.some((e) => e.type === 'SPOUSE')
  const hasRightConnection = edgesFrom?.some((e) => e.type === 'SPOUSE')

  /**
   * Handle node click event
   */
  const onClick = useCallback(() => {
    setIsExpand((prev) => !prev)
  }, [])

  /**
   * Handle node info click event
   */
  const onInfoClick = useCallback(() => data.onInfo?.(data.node), [data])

  /**
   * Handle mouse enter event
   */
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])

  /**
   * Handle mouse leave event
   */
  const handleMouseLeave = useCallback(() => {
    if (selectedNodeId) return
    setIsHovered(false)
    setIsExpand(false)
  }, [selectedNodeId])

  /**
   * Helper function to get side handles class names
   * @param isConnected {boolean}
   * @returns class names {string}
   */
  const getSideHandlesClass = (isConnected: boolean): string => {
    const isHoveredAndNotMobile = isHovered && !isMobile
    const isHoveredOrExpanded = isHoveredAndNotMobile || isExpanded
    const isHoveredAndNotConnected = isHoveredAndNotMobile && !isConnected
    const isExpandedAndIsConnected = isExpanded && isConnected
    const isMobileAndNotConnected = isMobile && !isConnected && !isHoveredOrExpanded

    return cn(NodeHandlesGlobalStyles, {
      'bg-ocean-200! h-6! w-2! opacity-100': isConnected,
      'border-ocean-200! bg-ocean-100! w-2! opacity-100 ': isHoveredOrExpanded,
      'border-ocean-200! bg-pale-ocean! h-6!': isHoveredAndNotConnected,
      'border-ocean-200! bg-ocean-100! h-8!': isExpanded,
      'bg-ocean-300!': isExpandedAndIsConnected,
      'border-pale-ocean! bg-ocean-200! h-6! w-2! opacity-100': isMobileAndNotConnected,
    })
  }

  /**
   * Helper function to get vertical handles class names
   * @param isConnected {boolean}
   * @returns class names {string}
   */
  const getVerticalHandlesClass = (isConnected: boolean): string => {
    const isHoveredAndNotMobile = isHovered && !isMobile
    const isHoveredOrExpanded = isHoveredAndNotMobile || isExpanded
    const isHoveredAndNotConnected = isHoveredAndNotMobile && !isConnected
    const isExpandedAndIsConnected = isExpanded && isConnected
    const isMobileAndNotConnected = isMobile && !isConnected && !isHoveredOrExpanded

    return cn(NodeHandlesGlobalStyles, {
      'bg-ocean-200! h-2! w-8! opacity-100': isConnected,
      'border-ocean-200! bg-ocean-100! h-2! opacity-100': isHoveredOrExpanded,
      'border-ocean-200! bg-pale-ocean! h-2! w-8!': isHoveredAndNotConnected,
      'border-ocean-200! w-16! bg-ocean-100!': isExpanded,
      'bg-ocean-300!': isExpandedAndIsConnected,
      'border-pale-ocean! bg-ocean-200! h-2! w-8! opacity-100': isMobileAndNotConnected,
    })
  }

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      variants={nodeContainerVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        'text-ocean-400 group relative flex h-20 w-52 cursor-pointer flex-col items-center justify-center rounded-lg',
        'shadow-center hover:bg-ocean-200 hover:text-pale-ocean bg-pale-ocean cursor-pointer p-2 outline-none select-none focus:outline-none',
        isExpanded &&
          `bg-ocean-200 text-pale-ocean ${withPicture ? 'rounded-none' : 'rounded-b-none'}`,
        isInModal &&
          `bg-ocean-200 text-pale-ocean ${withPicture ? 'rounded-none' : 'rounded-b-none'}`
      )}
    >
      <strong className="relative z-10 leading-none">{fullName}</strong>
      {birthYear || deathDate ? (
        <div
          className={cn(
            'relative z-10 mt-1 flex w-full justify-center space-x-2 text-xs font-medium',
            'opacity-70 group-hover:opacity-100'
          )}
        >
          {birthYear && <p>{birthYear}</p>}
          {deathYear && birthYear && <span>-</span>}
          {deathYear && <p>{deathYear}</p>}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          variants={handleVariants.right}
          initial="hidden"
          animate={
            (hasRightConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute top-1/2 right-0 -translate-y-1/2"
        >
          <Handle
            type="source"
            id="right"
            position={Position.Right}
            className={getSideHandlesClass(!!hasRightConnection)}
          />
        </motion.div>
        <motion.div
          variants={handleVariants.left}
          initial="hidden"
          animate={
            (hasLeftConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute top-1/2 left-0 -translate-y-1/2"
        >
          <Handle
            type="target"
            id="left"
            position={Position.Left}
            className={getSideHandlesClass(!!hasLeftConnection)}
          />
        </motion.div>
        <motion.div
          variants={handleVariants.top}
          initial="hidden"
          animate={
            (hasTopConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute top-0 left-1/2 -translate-x-1/2"
        >
          <Handle
            type="target"
            id="top"
            position={Position.Top}
            className={cn(
              getVerticalHandlesClass(!!hasTopConnection),
              isExpanded && withPicture && 'h-0!'
            )}
          />
        </motion.div>
        <motion.div
          variants={handleVariants.bottom}
          initial="hidden"
          animate={
            (hasBottomConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
        >
          <Handle
            type="source"
            id="bottom"
            position={Position.Bottom}
            className={cn(getVerticalHandlesClass(!!hasBottomConnection), isExpanded && 'h-0!')}
          />
        </motion.div>
      </div>
      {withPicture && (
        <motion.div
          onClick={(e) => e.stopPropagation()}
          variants={topExpandVariants}
          initial="collapsed"
          animate={isExpanded ? 'expanded' : 'collapsed'}
          className={cn(
            'bg-ocean-200 absolute bottom-full left-1/2 flex w-full origin-bottom -translate-x-1/2 justify-evenly',
            'cursor-default overflow-hidden rounded-t-xl'
          )}
        >
          <div className={cn('flex w-full items-center justify-center pt-3 pb-1')}>
            <motion.div variants={pictureContentVariants} className="relative">
              <motion.div
                variants={pictureHoverVariants}
                initial="idle"
                whileHover="hover"
                className="border-pale-ocean relative h-16 w-16 cursor-pointer overflow-hidden rounded-lg border-2"
              >
                <div
                  className={cn(
                    'bg-ocean-200 absolute inset-0 flex items-center justify-center',
                    showPictureLoader ? 'opacity-100' : 'pointer-events-none opacity-0'
                  )}
                >
                  <motion.div variants={loaderPulseVariants} animate="animate">
                    <LoaderIcon size={20} className="animate-spin" />
                  </motion.div>
                </div>
                <div
                  className={cn(
                    'bg-ocean-200 absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out',
                    showPicturePlaceholder
                      ? 'scale-100 opacity-100'
                      : 'pointer-events-none scale-95 opacity-0'
                  )}
                >
                  <Image size={24} />
                </div>
                {profilePicture && !pictureError && (
                  <img
                    className={cn(
                      'h-full w-full object-cover transition-all duration-500 ease-out',
                      isPictureLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                    )}
                    src={`${process.env.NEXT_PUBLIC_CLOUDFRONT_ASSETS_DOMAIN}/${profilePicture.fileKey}`}
                    alt="Profile"
                    onLoad={handlePictureLoad}
                    onError={handlePictureError}
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        variants={bottomExpandVariants}
        initial="collapsed"
        animate={isExpanded ? 'expanded' : 'collapsed'}
        className={cn(
          'shadow-center absolute top-full left-1/2 flex w-full origin-top -translate-x-1/2 justify-evenly',
          'bg-ocean-400 cursor-default overflow-hidden rounded-b-xl',
          isExpanded ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <motion.div
          variants={infoIconVariants}
          onClick={onInfoClick}
          className={cn(
            'text-ocean-400 bg-ocean-400 flex w-full cursor-pointer items-center justify-center p-2',
            'group/info hover:bg-ocean-400 transition-colors duration-300 outline-none focus:outline-none'
          )}
        >
          <Info
            size={16}
            className="stroke-pale-ocean group-hover/info:stroke-pale-ocean transition-colors duration-300"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
