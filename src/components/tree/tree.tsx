'use client'

import React from 'react'
import ReactFlow, { Controls, Background, ConnectionLineType } from 'reactflow'
import { useTranslations } from 'next-intl'

import { Family, TreeEdge, TreeNode } from '@/types'
import { useTreeState, useNodeForm, useEdgeOperations, useNodeOperations } from './hooks'
import { TreeToolbar, NodeFormModal, EdgeContextMenu, NodeContextMenu } from './ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/ui'
import { StyledEdge } from './edge'

interface StyledTreeProps {
  family: Family
  nodes: TreeNode[]
  edges: TreeEdge[]
}

export default function StyledTree({ family, nodes, edges }: StyledTreeProps) {
  const t_common = useTranslations('common')
  const t_toasts = useTranslations('toasts')
  const treeState = useTreeState(family, nodes, edges)
  const nodeForm = useNodeForm(family, () => {
    treeState.setShowModal(false)
  })
  const edgeOperations = useEdgeOperations(family, edges, treeState.treeEdges, treeState.setEdges)
  const nodeOperations = useNodeOperations(family, nodes)

  return (
    <div className="relative h-[90vh] w-full overflow-hidden bg-slate-100">
      {/* Toolbar */}
      <TreeToolbar onCreateNode={treeState.createNode} onResetView={treeState.resetView} />

      {/* Node Creation Modal */}
      <NodeFormModal
        showModal={treeState.showModal}
        loading={treeState.loading}
        form={nodeForm.form}
        onSubmit={nodeForm.onSubmit}
        onClose={treeState.handleModalClose}
      />

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={treeState.treeNodes}
        edges={treeState.treeEdges}
        onNodesChange={treeState.onNodesChange}
        onEdgesChange={treeState.onEdgesChange}
        nodeTypes={treeState.nodeTypes}
        onConnect={edgeOperations.onConnect}
        onEdgeClick={treeState.onEdgeClick}
        onEdgeContextMenu={treeState.onEdgeContextMenu}
        onNodeContextMenu={treeState.onNodeContextMenu}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineComponent={StyledEdge}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2e6b74', strokeWidth: 1 },
        }}
        panOnDrag
        zoomOnScroll
        deleteKeyCode={null}
        nodesDraggable={true}
        snapGrid={[15, 15]}
        className="bg-pale-ocean h-full w-full shadow-inner"
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <Background gap={24} size={1} color="#2e6b74" />
      </ReactFlow>

      {/* Edge Context Menu */}
      <EdgeContextMenu
        visible={treeState.edgeContextMenu.visible}
        x={treeState.edgeContextMenu.x}
        y={treeState.edgeContextMenu.y}
        edgeId={treeState.edgeContextMenu.edgeId}
        onDelete={() =>
          treeState.edgeContextMenu.edgeId &&
          edgeOperations.deleteEdge(
            treeState.edgeContextMenu.edgeId,
            treeState.closeEdgeContextMenu
          )
        }
        onClose={treeState.closeEdgeContextMenu}
      />

      {/* Node Context Menu */}
      <NodeContextMenu
        visible={treeState.nodeContextMenu.visible}
        x={treeState.nodeContextMenu.x}
        y={treeState.nodeContextMenu.y}
        nodeId={treeState.nodeContextMenu.nodeId}
        onDelete={() => {
          if (treeState.nodeContextMenu.nodeId) {
            treeState.showDeleteConfirmation(treeState.nodeContextMenu.nodeId)
            treeState.closeNodeContextMenu()
          }
        }}
        onClose={treeState.closeNodeContextMenu}
      />

      {/* Confirmation Delete Dialog */}
      <Dialog open={treeState.confirmDelete.open} onOpenChange={treeState.closeDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t_toasts('node-delete')}</DialogTitle>

            <DialogDescription className="my-2">
              {t_toasts('node-delete-confirmation')}
            </DialogDescription>
            <DialogDescription className="my-2">
              {t_toasts('node-delete-confirm-description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => treeState.closeDeleteConfirmation()}
              disabled={treeState.loading}
            >
              {t_common('cancel')}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (treeState.confirmDelete.nodeId) {
                  treeState.withAsync(() =>
                    nodeOperations.deleteNode(
                      treeState.confirmDelete.nodeId!,
                      treeState.closeDeleteConfirmation
                    )
                  )
                }
              }}
              disabled={treeState.loading}
            >
              {treeState.loading ? t_common('deleting') : t_common('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
