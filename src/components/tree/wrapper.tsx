'use client'

import React, { useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'

import { Tree, TreeEdge, TreeNode, Union } from '@/types'
import StyledTree from './tree'

export const TreeWrapper = ({
  readonly,
  tree,
  nodes,
  edges,
  unions,
}: {
  readonly: boolean
  tree: Tree
  nodes: TreeNode[]
  edges: TreeEdge[]
  unions: Union[]
}) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflowX
    document.body.style.overflowX = 'hidden'
    document.documentElement.style.overflowX = 'hidden'

    return () => {
      document.body.style.overflowX = originalOverflow
      document.documentElement.style.overflowX = ''
    }
  }, [])

  return (
    <ReactFlowProvider>
      <StyledTree readonly={readonly} tree={tree} nodes={nodes} edges={edges} unions={unions} />
    </ReactFlowProvider>
  )
}
