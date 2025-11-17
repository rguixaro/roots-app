'use client'

import { JSX } from 'react'
import { Position, Handle, NodeProps } from 'reactflow'

import { TreeNode } from '@/types'

interface StyledNodeProps {
  node: TreeNode
  onClick?: (label: string) => void
}

/**
 * A minimal node used as a spacer in the tree layout.
 * @param param0 {NodeProps<StyledNodeProps>}
 * @returns {JSX.Element}
 */
export function VoidNode({}: NodeProps<StyledNodeProps>): JSX.Element {
  return (
    <div className="bg-ocean-400 h-1.5 w-px rounded">
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
