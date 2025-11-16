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
  const [showModal, setShowModal] = useState(false)

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
   * Handle node click event
   * @param label
   */
  const handleNodeClick = (label: string) => {}

  /**
   * Create a new node by showing the modal
   */
  const createNode = () => setShowModal(true)

  /**
   * Handle modal close event
   */
  const handleModalClose = () => setShowModal(false)

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
    } = createTreeLayout(family.type, nodes, edges, handleNodeClick)
    return { nodes: layoutNodes, edges: layoutEdges, spousePairs }
  }, [family.type, edges, nodes])

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
  const [treeNodes, setNodes, onNodesChange] = useNodesState(computedNodes)
  /**
   * React Flow edges state
   */
  const [treeEdges, setEdges, onEdgesChange] = useEdgesState(computedEdges)

  /**
   * Sync computed nodes and edges with React Flow state
   */
  useEffect(() => {
    setNodes(computedNodes)
    setEdges(computedEdges)
  }, [computedNodes, computedEdges, setNodes, setEdges])

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
  const closeEdgeContextMenu = useCallback(() => {
    setEdgeContextMenu({ visible: false, x: 0, y: 0, edgeId: null })
  }, [])

  /**
   * Close the node context menu
   * @return void
   */
  const closeNodeContextMenu = useCallback(() => {
    setNodeContextMenu({ visible: false, x: 0, y: 0, nodeId: null })
  }, [])

  /**
   * Show confirmation dialog for node deletion
   * @param nodeId - The id of the node to delete
   * @return void
   */
  const showDeleteConfirmation = useCallback((nodeId: string) => {
    setConfirmDelete({ open: true, nodeId })
  }, [])

  /**
   * Close confirmation dialog
   * @return void
   */
  const closeDeleteConfirmation = useCallback(() => {
    setConfirmDelete({ open: false, nodeId: null })
  }, [])

  return {
    loading,
    edgeContextMenu,
    nodeContextMenu,
    confirmDelete,
    showModal,
    treeNodes,
    treeEdges,
    nodeTypes,

    setLoading,
    setNodes,
    setEdges,
    setShowModal,

    onNodesChange,
    onEdgesChange,
    onEdgeClick,
    onEdgeContextMenu,
    onNodeContextMenu,
    closeEdgeContextMenu,
    closeNodeContextMenu,
    showDeleteConfirmation,
    closeDeleteConfirmation,

    withAsync,
    resetView,
    createNode,
    handleModalClose,
  }
}
