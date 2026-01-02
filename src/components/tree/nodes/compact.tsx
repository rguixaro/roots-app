'use client'

import { useState, useCallback, JSX, useEffect } from 'react'
import { Position, Handle, NodeProps } from 'reactflow'
import { Info, ZoomIn } from 'lucide-react'
import { motion, Variants } from 'framer-motion'

import { Picture } from '@/ui'

import { cn, getProfilePicture } from '@/utils'

import { TreeNode } from '@/types'

interface StyledNodeCompactProps {
  node: TreeNode
  withPicture?: boolean
  selectedNodeId: string | null
  onInfo: (node: TreeNode) => void
  onFocus?: (node: string) => void
  collapseKey?: number
}

/**
 * Base styles for visual handle overlays (not actual ReactFlow handles)
 */
const HandleVisualStyles =
  'h-px w-px rounded-xl border-3 border-pale-ocean bg-pale-ocean transition-all duration-200'

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
 * Animation variants for the info icon with bounce
 */
const infoIconVariants: Variants = {
  collapsed: { opacity: 0, scale: 0.5 },
  expanded: { opacity: 1, scale: 1 },
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
  bottom: createHandleVariants(0.1),
  left: createHandleVariants(0.2),
  top: createHandleVariants(0.3),
}

/**
 * A styled node in the tree.
 * @param param0 {NodeProps<StyledNodeCompactProps>}
 * @returns {JSX.Element}
 */
export function StyledNodeCompact({ data }: NodeProps<StyledNodeCompactProps>): JSX.Element {
  const [isExpanded, setIsExpand] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { fullName, alias, birthDate, deathDate, edgesFrom, edgesTo } = data.node
  const { withPicture, selectedNodeId } = data

  const profilePicture = getProfilePicture(data.node)
  const isLargeText = fullName.length >= 15

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
  const onClick = useCallback(() => setIsExpand((prev) => !prev), [])

  /**
   * Handle node info click event
   */
  const onInfoClick = useCallback(() => {
    data.onInfo?.(data.node)
    setIsHovered(false)
    setIsExpand(false)
  }, [data])

  /**
   * Handle node focus click event
   */
  const onFocusClick = useCallback(() => {
    if (data.node.id.startsWith('couple-')) return
    data.onFocus?.(data.node.id)
  }, [data])

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

    return cn(HandleVisualStyles, {
      'bg-ocean-100 h-8 w-3': isConnected,
      'border-ocean-100 bg-ocean-200 w-3': isHoveredOrExpanded,
      'border-ocean-100 bg-ocean-50 h-8': isHoveredAndNotConnected,
      'border-ocean-100 bg-ocean-200 h-8': isExpanded,
      'bg-ocean-300 h-12': isExpandedAndIsConnected,
      'border-pale-ocean bg-ocean-50 h-8 w-3': isMobileAndNotConnected,
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

    return cn(HandleVisualStyles, {
      'bg-ocean-100 h-3 w-10': isConnected,
      'border-ocean-100 bg-ocean-200 h-3': isHoveredOrExpanded,
      'border-ocean-100 bg-ocean-50 h-3 w-10': isHoveredAndNotConnected,
      'border-ocean-100 bg-ocean-200 h-3 w-10': isExpanded,
      'bg-ocean-300 h-3 w-20': isExpandedAndIsConnected,
      'border-pale-ocean bg-ocean-50 h-3 w-10': isMobileAndNotConnected,
    })
  }

  /**
   * Render date range if available
   * @returns JSX.Element | null
   */
  function renderDateRange(): JSX.Element | null {
    return birthYear || deathDate ? (
      <div
        className={cn(
          'relative z-10 mt-1 flex space-x-1 text-xs font-medium',
          'opacity-70 group-hover:opacity-100'
        )}
      >
        {birthYear && <p>{birthYear}</p>}
        {deathYear && birthYear && <span>-</span>}
        {deathYear && <p>{deathYear}</p>}
      </div>
    ) : null
  }

  /**
   * Render alias if available
   * @returns JSX.Element | null
   */
  function renderAlias(): JSX.Element | null {
    return alias ? (
      <span
        className={cn(
          'relative z-10 mt-1 mr-1 text-xs font-medium',
          'opacity-70 group-hover:opacity-100'
        )}
      >
        {alias}
        {isLargeText && (birthDate || deathDate) ? <span>,&nbsp;</span> : null}
      </span>
    ) : null
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
        'text-ocean-400 group relative flex h-20 w-56 max-w-48 cursor-pointer items-center justify-start rounded-lg',
        'shadow-center-sm hover:bg-ocean-100 hover:text-pale-ocean bg-pale-ocean cursor-pointer p-2 outline-none select-none focus:outline-none',
        isExpanded && `bg-ocean-100 text-pale-ocean ${withPicture && 'rounded-b-none'}`
      )}
    >
      <motion.div variants={pictureContentVariants} className="px-2">
        <Picture
          fileKey={profilePicture?.fileKey}
          classNameContainer="relative h-12 w-12 cursor-pointer overflow-hidden rounded-lg"
          classNamePicture={cn('group-hover:bg-ocean-100', isExpanded && 'bg-ocean-100')}
        />
      </motion.div>
      {isLargeText ? (
        <div className="justify-star flex w-full flex-col items-start px-2">
          <span
            className={cn('relative z-10 line-clamp-3 text-left text-xs leading-tight font-bold')}
          >
            {fullName}
          </span>
          <div className="flex w-full">
            {renderAlias()}
            {renderDateRange()}
          </div>
        </div>
      ) : (
        <div className="justify-star flex w-full flex-col items-start px-2">
          <span className="relative z-10 text-left leading-tight font-bold">{fullName}</span>
          {renderAlias()}
          {renderDateRange()}
        </div>
      )}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className={cn(
          'pointer-events-auto border-0! transition-all',
          'right-0! translate-x-1/2! opacity-0!',
          isExpanded || isHovered ? 'h-12! w-12!' : 'h-0! w-0!'
        )}
      />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className={cn(
          'pointer-events-auto border-0! transition-all',
          'left-0! -translate-x-1/2! opacity-0!',
          isExpanded || isHovered ? 'h-12! w-12!' : 'h-0! w-0!'
        )}
      />
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className={cn(
          'pointer-events-auto border-0! transition-all',
          'top-0! -translate-y-1/2! opacity-0!',
          isExpanded || isHovered ? 'h-12! w-12!' : 'h-0! w-0!'
        )}
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className={cn(
          'pointer-events-auto border-0! transition-all',
          'bottom-0! translate-y-1/2! opacity-0!',
          isHovered && !isExpanded
            ? 'pointer-events-auto h-12! w-12!'
            : 'pointer-events-none! h-0! w-0!'
        )}
      />
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          variants={handleVariants.right}
          initial="hidden"
          animate={
            (hasRightConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2"
        >
          <div className={getSideHandlesClass(!!hasRightConnection)} />
        </motion.div>
        <motion.div
          variants={handleVariants.left}
          initial="hidden"
          animate={
            (hasLeftConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2"
        >
          <div className={getSideHandlesClass(!!hasLeftConnection)} />
        </motion.div>
        <motion.div
          variants={handleVariants.top}
          initial="hidden"
          animate={
            (hasTopConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className={cn(getVerticalHandlesClass(!!hasTopConnection))} />
        </motion.div>
        <motion.div
          variants={handleVariants.bottom}
          initial="hidden"
          animate={
            (hasBottomConnection && hasMounted) || isHovered || isExpanded || isMobile
              ? 'visible'
              : 'hidden'
          }
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
        >
          <div
            className={cn(getVerticalHandlesClass(!!hasBottomConnection), isExpanded && 'h-0!')}
          />
        </motion.div>
      </div>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        variants={bottomExpandVariants}
        initial="collapsed"
        animate={isExpanded ? 'expanded' : 'collapsed'}
        className={cn(
          'shadow-center absolute top-full left-1/2 flex w-full origin-top -translate-x-1/2 justify-evenly',
          'bg-ocean-300 cursor-default overflow-hidden rounded-b-xl',
          isExpanded ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <motion.div
          variants={infoIconVariants}
          onClick={onInfoClick}
          className={cn(
            'text-ocean-400 bg-ocean-300 flex w-full cursor-pointer items-center justify-center p-2',
            'group/info hover:bg-ocean-400 transition-colors duration-300 outline-none focus:outline-none'
          )}
        >
          <Info
            size={16}
            className="stroke-pale-ocean group-hover/info:stroke-ocean-50 transition-colors duration-300"
          />
        </motion.div>
        {data.onFocus != null && (
          <motion.div
            variants={infoIconVariants}
            onClick={onFocusClick}
            className={cn(
              'text-ocean-400 bg-ocean-300 flex w-full cursor-pointer items-center justify-center p-2',
              'group/info hover:bg-ocean-400 transition-colors duration-300 outline-none focus:outline-none'
            )}
          >
            <ZoomIn
              size={16}
              className="stroke-pale-ocean group-hover/info:stroke-ocean-50 transition-colors duration-300"
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
