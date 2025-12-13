'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useReactFlow, useNodesState, useEdgesState, Edge } from 'reactflow'

import { TreeNode, TreeEdge, Tree } from '@/types'

import { createTreeLayout, computedLayout, positionCoupleNodes } from '@/components/tree/layout'
import { StyledNode, StyledNodeCompact, VoidNode } from '@/components/tree/nodes'

export function useTreeState(tree: Tree, nodes: TreeNode[], edges: TreeEdge[]) {
  /**
   * Utility states
   */
  const [loading, setLoading] = useState<boolean>(false)

  /**
   * Modals state
   */
  const [displayCreate, setDisplayCreate] = useState(false)
  const [displayInfo, setDisplayInfo] = useState(false)

  const [selectedNode, selectNode] = useState<TreeNode | null>(null)

  /**
   * Key to trigger collapse of all expanded nodes
   */
  const [collapseKey, setCollapseKey] = useState(0)

  /**
   * Edge context menu state
   */
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    edgeId: string | null
  }>({ visible: false, x: 0, y: 0, edgeId: null })

  /**
   * Confirmation dialog state
   */
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    nodeId: string | null
  }>({ open: false, nodeId: null })

  const reactFlowInstance = useReactFlow()

  /**
   * Node types mapping
   * @return {object} Node types mapping
   */
  const nodeTypes = useMemo(
    () => ({
      COMPACT: tree.compact ? StyledNodeCompact : StyledNode,
      LOOSE: tree.compact ? StyledNodeCompact : StyledNode,
      COUPLE: VoidNode,
    }),
    [tree.compact]
  )

  /**
   * Reset the view to fit all nodes
   */
  const resetView = () => reactFlowInstance.fitView({ padding: 0.2 })

  /**
   * Handle node info click event
   * @param node {TreeNode} Node that was clicked
   */
  const onInfo = (node: TreeNode) => {
    selectNode(node)
    setDisplayInfo(true)
  }

  /**
   * Collapse all expanded nodes (triggered on pane click)
   */
  const collapseAllNodes = useCallback(() => setCollapseKey((prev) => prev + 1), [])

  /**
   * Create a new node by showing the modal
   */
  const createNode = () => setDisplayCreate(true)

  /**
   * Handle modal close event
   */
  const dismissModal = () => {
    if (displayCreate) setDisplayCreate(false)
    else if (displayInfo) setDisplayInfo(false)

    if (selectedNode) setTimeout(() => selectNode(null), 150)
  }

  /**
   * Handle async operations with loading state
   * @param fn Async function to execute
   * @return Promise<void>
   */
  const withAsync = async <T>(fn: () => Promise<T>) => {
    try {
      setLoading(true)
      await fn()
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create tree layout
   * @return {{nodes: Node[], edges: Edge[], spousePairs: [string, string][]}} Layout with nodes, edges, and spouse pairs
   */
  const layout = useMemo(() => {
    const {
      nodes: layoutNodes,
      edges: layoutEdges,
      spousePairs,
    } = createTreeLayout(tree, nodes, edges, selectedNode?.id ?? null, onInfo, collapseKey)
    return { nodes: layoutNodes, edges: layoutEdges, spousePairs }
  }, [tree, edges, nodes, selectedNode, collapseKey])

  /**
   * Compute layout nodes and edges
   * @return {{nodes: Node[], edges: Edge[]}} Computed nodes and edges
   */
  const { nodes: layoutNodes, edges: computedEdges } = useMemo(
    () => computedLayout(layout.nodes, layout.edges),
    [layout]
  )

  /**
   * Position couple nodes in the layout
   * @return {Node[]} Positioned nodes
   */
  const computedNodes = useMemo(
    () => positionCoupleNodes(layoutNodes, layout.spousePairs),
    [layoutNodes, layout.spousePairs]
  )

  /**
   * React Flow nodes state
   */
  const [treeNodes, setTreeNodes, onTreeNodesChange] = useNodesState(computedNodes)
  /**
   * React Flow edges state
   */
  const [treeEdges, setTreeEdges, onTreeEdgesChange] = useEdgesState(computedEdges)

  /**
   * Sync computed nodes and edges with React Flow state
   */
  useEffect(() => {
    setTreeNodes(computedNodes)
    setTreeEdges(computedEdges)
  }, [computedNodes, computedEdges, setTreeNodes, setTreeEdges])

  /**
   * Handle edge click event (left-click)
   * @param event React mouse event
   * @param edge Edge that was clicked
   * @return void
   */
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault()
    setEdgeContextMenu({ visible: true, x: event.clientX, y: event.clientY, edgeId: edge.id })
  }, [])

  /**
   * Handle edge context menu event (right-click)
   * @param event React mouse event
   * @param edge Edge that was right-clicked
   * @return void
   */
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault()
    setEdgeContextMenu({ visible: true, x: event.clientX, y: event.clientY, edgeId: edge.id })
  }, [])

  /**
   * Close the edge context menu
   * @return void
   */
  const closeEdgeContextMenu = useCallback(
    () => setEdgeContextMenu({ visible: false, x: 0, y: 0, edgeId: null }),
    []
  )

  /**
   * Show confirmation dialog for node deletion
   * @param nodeId - The id of the node to delete
   * @return void
   */
  const showDeleteConfirmation = useCallback(
    (nodeId: string) => setConfirmDelete({ open: true, nodeId }),
    []
  )

  /**
   * Close confirmation dialog
   * @return void
   */
  const closeDeleteConfirmation = useCallback(() => {
    setConfirmDelete({ open: false, nodeId: null })
    if (displayInfo) dismissModal()
  }, [])

  return {
    setLoading,
    loading,

    edgeContextMenu,

    onEdgeContextMenu,

    closeEdgeContextMenu,

    setTreeNodes,
    setTreeEdges,

    onTreeNodesChange,
    onTreeEdgesChange,

    treeNodes,
    treeEdges,

    nodeTypes,

    createNode,
    dismissModal,

    selectedNode,
    selectNode,

    onEdgeClick,

    displayCreate,
    displayInfo,

    setDisplayCreate,
    setDisplayInfo,

    confirmDelete,
    showDeleteConfirmation,
    closeDeleteConfirmation,

    withAsync,
    resetView,

    collapseAllNodes,
  }
}
