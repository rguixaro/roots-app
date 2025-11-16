'use client'

import { useState, useCallback, JSX } from 'react'
import { Position, Handle, NodeProps } from 'reactflow'
import { Info, Images } from 'lucide-react'

import { cn } from '@/utils'
import { TreeNode } from '@/types'

interface StyledNodeProps {
  node: TreeNode
  onClick?: (label: string) => void
}

/**
 * Global styles for node handles
 */
const NodeGlobalStyles =
  'bg-pale-ocean! h-px! w-px! rounded-full! border-2! border-white! opacity-0 transition-all duration-200'

/**
 * A styled node in the tree.
 * @param param0 {NodeProps<StyledNodeProps>}
 * @returns {JSX.Element}
 */
export function StyledNode({ data }: NodeProps<StyledNodeProps>): JSX.Element {
  const [expanded, expand] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { fullName, birthDate, deathDate, edgesFrom, edgesTo } = data.node

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
  const handleClick = useCallback(() => {
    data.onClick?.(fullName)
    expand((prev) => !prev)
  }, [data])

  /**
   * Handle mouse enter event
   */
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])

  /**
   * Handle mouse leave event
   */
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    expand(false)
  }, [])

  /**
   * Helper function to get side handles class names
   * @param hasConnection {boolean}
   * @returns class names {string}
   */
  const getSideHandlesClass = (hasConnection: boolean): string => {
    const isVisible = isHovered || expanded
    const showAsConnected = hasConnection
    const showOnHover = isHovered && !hasConnection
    const isInExpandedState = expanded
    const hasConnectionInExpandedState = expanded && hasConnection

    return cn(NodeGlobalStyles, {
      'bg-ocean-100! w-1.5! opacity-100': isVisible,
      'bg-ocean-300! h-4! w-1.5! opacity-100': showAsConnected,
      'h-4!': showOnHover,
      'border-ocean-50! bg-ocean-200!': isInExpandedState,
      'bg-ocean-300!': hasConnectionInExpandedState,
    })
  }

  /**
   * Helper function to get vertical handles class names
   * @param hasConnection {boolean}
   * @returns class names {string}
   */
  const getVerticalHandlesClass = (hasConnection: boolean): string => {
    const isVisible = isHovered || expanded
    const showAsConnected = hasConnection
    const showOnHover = isHovered && !hasConnection
    const isInExpandedState = expanded
    const hasConnectionInExpandedState = expanded && hasConnection

    return cn(NodeGlobalStyles, {
      'bg-ocean-100! h-1.5! opacity-100': isVisible,
      'bg-ocean-300! h-1.5! w-6! opacity-100': showAsConnected,
      'w-6!': showOnHover,
      'border-ocean-50! bg-ocean-200! w-16!': isInExpandedState,
      'bg-ocean-300!': hasConnectionInExpandedState,
    })
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'text-ocean-400 relative h-15 w-40 cursor-pointer rounded-xl',
        'shadow-center cursor-pointer bg-white p-3 transition-all duration-200 select-none',
        expanded && 'bg-ocean-50 rounded-b-none'
      )}
    >
      <strong>{fullName}</strong>
      {birthYear && <p className="text-xs">{birthYear}</p>}
      {deathYear && <p className="text-xs">{deathYear}</p>}

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
        className={getVerticalHandlesClass(!!hasTopConnection)}
      />

      {/* Bottom handle (parent-child relationships) */}
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className={getVerticalHandlesClass(!!hasBottomConnection)}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute top-full left-1/2 flex w-full justify-evenly bg-white px-3 py-3',
          'origin-top -translate-x-1/2 scale-y-0 overflow-hidden rounded-b-xl shadow-xl',
          'cursor-default transition-transform duration-300 ease-out',
          expanded ? 'pointer-events-auto scale-y-100' : 'pointer-events-none'
        )}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="hover:bg-ocean-50 cursor-pointer rounded bg-white p-1 transition-colors duration-300"
        >
          <Info size={16} className="text-ocean-400" />
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          className="hover:bg-ocean-50 cursor-pointer rounded bg-white p-1 transition-colors duration-300"
        >
          <Images size={16} className="text-ocean-400" />
        </div>
      </div>
    </div>
  )
}
