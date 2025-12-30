'use client'

import ReactFlow, { Background, ConnectionLineType } from 'reactflow'
import { useTranslations } from 'next-intl'

import {
  useTreeState,
  useNodeCreateForm,
  useEdgeOperations,
  useNodeOperations,
  useNodeUpdateForm,
} from '@/hooks'

import {
  TreeOverlay,
  NodeInfoModal,
  NodeCreateModal,
  ViewingOptions,
} from '@/components/tree/modal'
import { EdgeContextMenu } from '@/components/tree/context'
import { StyledEdge } from '@/components/tree/edges'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/ui'

import { Tree, TreeEdge, TreeNode } from '@/types'

import { ocean } from '@/styles/colors'

interface StyledTreeProps {
  readonly: boolean
  tree: Tree
  nodes: TreeNode[]
  edges: TreeEdge[]
}

export default function StyledTree({ readonly, tree, nodes, edges }: StyledTreeProps) {
  const t_common = useTranslations('common')
  const t_toasts = useTranslations('toasts')

  const treeState = useTreeState(tree, nodes, edges, {
    initialGenerationsUp: 2,
    initialGenerationsDown: 2,
    enableProgressiveDisclosure: true,
  })

  /**
   * Dismiss any open modal
   */
  const dismissModal = () => {
    treeState.setDisplayCreate(false)
    treeState.setDisplayInfo(false)
  }

  const nodeCreateForm = useNodeCreateForm(tree, dismissModal)
  const nodeUpdateForm = useNodeUpdateForm(tree, treeState.selectedNode, dismissModal)

  const edgeOperations = useEdgeOperations(tree, edges, treeState.treeEdges, treeState.setTreeEdges)
  const nodeOperations = useNodeOperations(tree, nodes)

  return (
    <div className="relative h-full w-full overflow-hidden">
      <TreeOverlay
        readonly={readonly}
        tree={tree}
        viewingOptionsEnabled={treeState.viewingOptionsEnabled}
        onCreateNode={treeState.createNode}
        onResetView={treeState.resetView}
        onFocus={treeState.setViewingOptionsShown}
      />
      <ViewingOptions
        enabled={treeState.viewingOptionsEnabled}
        visible={treeState.viewingOptionsShown}
        nodes={nodes}
        visibleNodes={treeState.treeNodes}
        showAllNodes={treeState.showAllNodes}
        adjustGenerations={treeState.adjustGenerations}
        generationsUp={treeState.generationsUp}
        generationsDown={treeState.generationsDown}
        toggleShowAll={treeState.toggleShowAll}
        focusOnNode={treeState.focusOnNode}
        totalNodeCount={nodes.length}
      />
      <NodeInfoModal
        readonly={readonly}
        showModal={treeState.displayInfo}
        treeType={tree.type}
        node={treeState.selectedNode}
        withPicture={tree.nodeImage}
        withGallery={tree.nodeGallery}
        form={nodeUpdateForm.form}
        onUpdate={nodeUpdateForm.onSubmit}
        onClose={treeState.dismissModal}
        onDelete={() => {
          if (treeState.selectedNode?.id) {
            treeState.showDeleteConfirmation(treeState.selectedNode.id)
          }
        }}
      />
      <NodeCreateModal
        treeType={tree.type}
        showModal={treeState.displayCreate}
        form={nodeCreateForm.form}
        onCreate={nodeCreateForm.onSubmit}
        onClose={treeState.dismissModal}
      />
      <ReactFlow
        nodes={treeState.treeNodes}
        edges={treeState.treeEdges}
        onNodesChange={treeState.onTreeNodesChange}
        onEdgesChange={treeState.onTreeEdgesChange}
        nodeTypes={treeState.nodeTypes}
        onConnect={edgeOperations.onConnect}
        onEdgeClick={treeState.onEdgeClick}
        onEdgeContextMenu={treeState.onEdgeContextMenu}
        onPaneClick={treeState.collapseAllNodes}
        connectionLineType={ConnectionLineType.SimpleBezier}
        connectionLineComponent={StyledEdge}
        panOnDrag
        zoomOnScroll
        deleteKeyCode={null}
        className={'bg-ocean-50 h-full w-full shadow-inner'}
        onlyRenderVisibleElements={false}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
      >
        <Background gap={24} size={1} color={ocean[300]} />
      </ReactFlow>
      <EdgeContextMenu
        visible={treeState.edgeContextMenu.visible && !readonly}
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
      <Dialog open={treeState.confirmDelete.open} onOpenChange={treeState.closeDeleteConfirmation}>
        <DialogContent className="text-ocean-400">
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
              className="font-bold"
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
