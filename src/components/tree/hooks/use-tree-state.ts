'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useReactFlow, useNodesState, useEdgesState, Edge } from 'reactflow'

import { Family, TreeNode, TreeEdge } from '@/types'

import { createTreeLayout, computedLayout, positionCoupleNodes } from '../layout'

import { StyledNode, VoidNode } from '../nodes'

export function useTreeState(family: Family, nodes: TreeNode[], edges: TreeEdge[]) {
  /**
   * Utility states
   */
  const [loading, setLoading] = useState<boolean>(false)

  /**
   * Modals state
   */
  const [displayCreate, setDisplayCreate] = useState(false)
  const [displayUpdate, setDisplayUpdate] = useState(false)

  const [selectedNode, selectNode] = useState<TreeNode | null>(null)

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
   * Node context menu state
   */
  const [nodeContextMenu, setNodeContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    nodeId: string | null
  }>({ visible: false, x: 0, y: 0, nodeId: null })

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
  const nodeTypes = useMemo(() => ({ [family.type]: StyledNode, COUPLE: VoidNode }), [family.type])

  /**
   * Reset the view to fit all nodes
   */
  const resetView = () => reactFlowInstance.fitView({ padding: 0.2 })

  /**
   * Handle node update click event
   * @param node {TreeNode} Node that was clicked
   */
  const onUpdate = (node: TreeNode) => {
    selectNode(node)
    setDisplayUpdate(true)
  }

  /**
   * Handle node gallery click event
   * @param node {TreeNode} Node that was clicked
   */
  const onGallery = (node: TreeNode) => {
    selectNode(node)
    setDisplayUpdate(true)
  }

  /**
   * Create a new node by showing the modal
   */
  const createNode = () => setDisplayCreate(true)

  /**
   * Handle modal close event
   */
  const dismissModal = () => {
    if (displayCreate) setDisplayCreate(false)
    else if (displayUpdate) setDisplayUpdate(false)

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
    } = createTreeLayout(family, nodes, edges, onUpdate, onGallery)
    return { nodes: layoutNodes, edges: layoutEdges, spousePairs }
  }, [family, edges, nodes])

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
   * Handle node context menu event (right-click)
   * @param event React mouse event
   * @param node Node that was right-clicked
   * @return void
   */
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    event.preventDefault()
    setNodeContextMenu({ visible: true, x: event.clientX, y: event.clientY, nodeId: node.id })
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
   * Close the node context menu
   * @return void
   */
  const closeNodeContextMenu = useCallback(
    () => setNodeContextMenu({ visible: false, x: 0, y: 0, nodeId: null }),
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
    if (displayUpdate) dismissModal()
  }, [])

  return {
    setLoading,
    loading,

    nodeContextMenu,
    edgeContextMenu,

    onNodeContextMenu,
    onEdgeContextMenu,

    closeNodeContextMenu,
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
    displayUpdate,

    setDisplayCreate,
    setDisplayUpdate,

    confirmDelete,
    showDeleteConfirmation,
    closeDeleteConfirmation,

    withAsync,
    resetView,
  }
}
