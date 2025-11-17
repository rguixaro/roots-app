'use client'

import React, { useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'

import { Family, TreeEdge, TreeNode } from '@/types'
import StyledTree from './tree'

export const TreeWrapper = ({
  readonly,
  family,
  nodes,
  edges,
}: {
  readonly: boolean
  family: Family
  nodes: TreeNode[]
  edges: TreeEdge[]
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
      <StyledTree readonly={readonly} family={family} nodes={nodes} edges={edges} />
    </ReactFlowProvider>
  )
}
