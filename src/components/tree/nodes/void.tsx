'use client'

import { JSX } from 'react'
import { Position, Handle, NodeProps } from 'reactflow'

import { TreeNode } from '@/types'

import { cn } from '@/utils'

interface StyledNodeProps {
  node: TreeNode
  onClick?: (label: string) => void
  hasChildren?: boolean
}

/**
 * Couple spacer node where spouse legs and child edges converge.
 * Childless unions render fully invisible.
 */
export function VoidNode({ data }: NodeProps<StyledNodeProps>): JSX.Element {
  const hasChildren = !!data?.hasChildren
  return (
    <div className={cn('h-2 w-1', hasChildren && 'bg-ocean-100')}>
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        className="bg-ocean-400! m-0! h-1! w-1! p-0! opacity-0"
        isConnectable={false}
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="bg-ocean-400! m-0! h-1! w-1! p-0! opacity-0"
        isConnectable={false}
      />
    </div>
  )
}
