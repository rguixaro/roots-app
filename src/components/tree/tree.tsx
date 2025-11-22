'use client'

import React from 'react'
import ReactFlow, { Background, ConnectionLineType } from 'reactflow'
import { useTranslations } from 'next-intl'

import {
  useTreeState,
  useNodeCreateForm,
  useEdgeOperations,
  useNodeOperations,
  useNodeUpdateForm,
} from './hooks'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/ui'

import {
  TreeToolbar,
  NodeUpdateModal,
  NodeCreateModal,
  EdgeContextMenu,
  NodeContextMenu,
} from './ui'

import { Family, TreeEdge, TreeNode } from '@/types'

import { ocean } from '@/styles/colors'

import { StyledEdge } from './edge'

interface StyledTreeProps {
  readonly: boolean
  family: Family
  nodes: TreeNode[]
  edges: TreeEdge[]
}

export default function StyledTree({ readonly, family, nodes, edges }: StyledTreeProps) {
  const t_common = useTranslations('common')
  const t_toasts = useTranslations('toasts')

  const treeState = useTreeState(family, nodes, edges)

  /**
   * Dismiss any open modal
   */
  const dismissModal = () => {
    treeState.setDisplayCreate(false)
    treeState.setDisplayUpdate(false)
  }

  const nodeCreateForm = useNodeCreateForm(family, dismissModal)
  const nodeUpdateForm = useNodeUpdateForm(family, treeState.selectedNode, dismissModal)

  const edgeOperations = useEdgeOperations(
    family,
    edges,
    treeState.treeEdges,
    treeState.setTreeEdges
  )
  const nodeOperations = useNodeOperations(family, nodes)

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Toolbar */}
      <TreeToolbar
        family={family}
        readonly={readonly}
        onCreateNode={treeState.createNode}
        onResetView={treeState.resetView}
      />

      {/* Node Update Modal */}
      <NodeUpdateModal
        showModal={treeState.displayUpdate}
        node={treeState.selectedNode}
        form={nodeUpdateForm.form}
        onUpdate={nodeUpdateForm.onSubmit}
        onClose={treeState.dismissModal}
        onDelete={() => {
          if (treeState.selectedNode?.id) {
            treeState.showDeleteConfirmation(treeState.selectedNode.id)
          }
        }}
      />

      {/* Node Create Modal */}
      <NodeCreateModal
        showModal={treeState.displayCreate}
        form={nodeCreateForm.form}
        onCreate={nodeCreateForm.onSubmit}
        onClose={treeState.dismissModal}
      />

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={treeState.treeNodes}
        edges={treeState.treeEdges}
        onNodesChange={treeState.onTreeNodesChange}
        onEdgesChange={treeState.onTreeEdgesChange}
        nodeTypes={treeState.nodeTypes}
        onConnect={edgeOperations.onConnect}
        onEdgeClick={treeState.onEdgeClick}
        onEdgeContextMenu={treeState.onEdgeContextMenu}
        onNodeContextMenu={treeState.onNodeContextMenu}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineComponent={StyledEdge}
        panOnDrag
        zoomOnScroll
        deleteKeyCode={null}
        nodesDraggable={true}
        snapGrid={[15, 15]}
        className="bg-ocean-50 h-full w-full shadow-inner"
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={32} size={1} color={ocean[300]} />
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
              variant="ghost"
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
