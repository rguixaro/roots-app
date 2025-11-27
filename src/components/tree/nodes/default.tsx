'use client'

import { useState, useCallback, JSX, useEffect } from 'react'
import { Position, Handle, NodeProps } from 'reactflow'
import { Info } from 'lucide-react'

import { cn } from '@/utils'

import { TreeNode } from '@/types'

interface StyledNodeProps {
  node: TreeNode
  withPicture?: boolean
  selectedNodeId: string | null
  onInfo: (node: TreeNode) => void
}

/**
 * Global styles for node handles
 */
const NodeHandlesGlobalStyles =
  'h-px! w-px! rounded-full! border-3! border-white! opacity-0 transition-all duration-200 bg-pale-ocean!'

/**
 * A styled node in the tree.
 * @param param0 {NodeProps<StyledNodeProps>}
 * @returns {JSX.Element}
 */
export function StyledNode({ data }: NodeProps<StyledNodeProps>): JSX.Element {
  const [isExpanded, setIsExpand] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isInModal, setIsInModal] = useState(false)

  const { id, fullName, birthDate, deathDate, edgesFrom, edgesTo } = data.node
  const { withPicture, selectedNodeId } = data

  useEffect(() => {
    setIsInModal(selectedNodeId === id)
  }, [selectedNodeId, id])

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
    const isHoveredOrExpanded = isHovered || isExpanded
    const isHoveredAndNotConnected = isHovered && !isConnected
    const isExpandedAndIsConnected = isExpanded && isConnected

    return cn(NodeHandlesGlobalStyles, {
      'border-ocean-100! w-2! opacity-100 ': isHoveredOrExpanded,
      'bg-ocean-200! h-6! w-2! opacity-100': isConnected,
      'border-ocean-100! bg-pale-ocean! h-6!': isHoveredAndNotConnected,
      'border-ocean-100! bg-ocean-200! h-8!': isExpanded,
      'bg-ocean-300!': isExpandedAndIsConnected,
    })
  }

  /**
   * Helper function to get vertical handles class names
   * @param isConnected {boolean}
   * @returns class names {string}
   */
  const getVerticalHandlesClass = (isConnected: boolean): string => {
    const isHoveredOrExpanded = isHovered || isExpanded
    const isHoveredAndNotConnected = isHovered && !isConnected
    const isExpandedAndIsConnected = isExpanded && isConnected

    return cn(NodeHandlesGlobalStyles, {
      'border-ocean-100! h-2! opacity-100': isHoveredOrExpanded,
      'bg-ocean-200! h-2! w-8! opacity-100': isConnected,
      'border-ocean-100! bg-pale-ocean! h-2! w-8!': isHoveredAndNotConnected,
      'border-ocean-100! w-16! bg-ocean-200!': isExpanded,
      'bg-ocean-300!': isExpandedAndIsConnected,
    })
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'text-ocean-400 group relative flex h-20 w-52 cursor-pointer flex-col items-center justify-center rounded-lg',
        'shadow-center hover:bg-ocean-100 hover:text-pale-ocean cursor-pointer bg-white p-2 transition-all duration-200 select-none',
        isExpanded &&
          `bg-ocean-100 text-pale-ocean ${withPicture ? 'rounded-none' : 'rounded-b-none'}`,
        isInModal &&
          `bg-ocean-100 text-pale-ocean ${withPicture ? 'rounded-none' : 'rounded-b-none'}`
      )}
    >
      <strong className="leading-none">{fullName}</strong>
      {birthYear || deathDate ? (
        <div
          className={cn(
            'mt-1 flex w-full justify-center space-x-2 text-xs font-medium',
            'opacity-70 group-hover:opacity-100'
          )}
        >
          {birthYear && <p>{birthYear}</p>}
          {deathYear && birthYear && <span>-</span>}
          {deathYear && <p>{deathYear}</p>}
        </div>
      ) : null}
      {/* Right handle (spouse relationships) */}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className={getSideHandlesClass(!!hasRightConnection)}
      />
      {/* Left handle (spouse relationships) */}
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className={getSideHandlesClass(!!hasLeftConnection)}
      />
      {/* Top handle (parent-child relationships) */}
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className={cn(
          getVerticalHandlesClass(!!hasTopConnection),
          isExpanded && withPicture && 'h-0!'
        )}
      />
      {/* Bottom handle (parent-child relationships) */}
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className={cn(getVerticalHandlesClass(!!hasBottomConnection), isExpanded && 'h-0!')}
      />
      {/* Picture expanded section */}
      {withPicture && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute bottom-full left-1/2 flex w-full justify-evenly bg-white',
            'origin-bottom -translate-x-1/2 scale-y-0 overflow-hidden rounded-t-xl',
            'cursor-default transition-transform duration-300 ease-out',
            isExpanded && 'scale-y-100'
          )}
        >
          <div className={cn('bg-ocean-100 flex w-full items-center justify-center pt-3 pb-0')}>
            <img
              className="bg-ocean-100 border-pale-ocean img-fluid h-16 w-16 rounded-lg border-2 object-cover shadow"
              src="https://images.unsplash.com/photo-1532562066470-f6f5f6d47924?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            />
          </div>
        </div>
      )}
      {/* Actions expanded section */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute top-full left-1/2 flex w-full justify-evenly bg-white',
          'shadow-center origin-top -translate-x-1/2 scale-y-0 overflow-hidden rounded-b-xl',
          'cursor-default transition-transform duration-300 ease-out',
          isExpanded ? 'pointer-events-auto scale-y-100' : 'pointer-events-none'
        )}
      >
        <div
          onClick={onInfoClick}
          className={cn(
            'text-ocean-400 flex w-full cursor-pointer items-center justify-center bg-white p-2',
            'group/info hover:bg-ocean-400 transition-colors duration-300'
          )}
        >
          <Info
            size={16}
            className="stroke-ocean-400 group-hover/info:stroke-pale-ocean transition-colors duration-300"
          />
        </div>
      </div>
    </div>
  )
}
