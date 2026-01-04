'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  useReactFlow,
  useNodesState,
  useEdgesState,
  Node as FlowNode,
  Edge as FlowEdge,
} from 'reactflow'

import { TreeNode, TreeEdge, Tree } from '@/types'

import {
  createTreeLayout,
  computedLayout,
  positionCoupleNodes,
  getVisibleNodesAndEdges,
} from '@/components/tree/layout'
import { StyledNode, VoidNode } from '@/components/tree/nodes'

import { ocean } from '@/styles/colors'

interface UseTreeStateOptions {
  initialGenerationsUp?: number
  initialGenerationsDown?: number
  enableProgressiveDisclosure?: boolean
}

export function useTreeState(
  tree: Tree,
  allNodes: TreeNode[],
  allEdges: TreeEdge[],
  options: UseTreeStateOptions = {}
) {
  const {
    initialGenerationsUp = 2,
    initialGenerationsDown = 2,
    enableProgressiveDisclosure = true,
  } = options

  /**
   * Progressive disclosure state
   */
  const [viewingOptionsShown, setViewingOptionsShown] = useState(false)
  const [focusOnNode, setFocusOnNode] = useState<string | null>(null)
  const [generationsUp, setGenerationsUp] = useState(initialGenerationsUp)
  const [generationsDown, setGenerationsDown] = useState(initialGenerationsDown)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [showAllNodes, setShowAllNodes] = useState(true)

  const viewingOptionsEnabled =
    enableProgressiveDisclosure && tree.type !== 'ANIMAL' && allNodes.length > 6

  /**
   * Calculate visible nodes based on progressive disclosure settings
   */
  const { nodes, edges, hiddenCounts } = useMemo(() => {
    if (!viewingOptionsEnabled || showAllNodes || !focusOnNode) {
      return {
        nodes: allNodes,
        edges: allEdges,
        hiddenCounts: new Map<string, { parents: number; children: number }>(),
      }
    }

    return getVisibleNodesAndEdges(
      allNodes,
      allEdges,
      focusOnNode,
      generationsUp,
      generationsDown,
      expandedNodes
    )
  }, [
    allNodes,
    allEdges,
    focusOnNode,
    generationsUp,
    generationsDown,
    expandedNodes,
    showAllNodes,
    viewingOptionsEnabled,
  ])

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
      DEFAULT: StyledNode,
      COUPLE: VoidNode,
    }),
    []
  )

  /**
   * Reset the view to fit all nodes
   */
  const resetView = () => reactFlowInstance.fitView({ padding: 0.2 })

  /**
   * Handle node info click event
   * @param node {TreeNode} Node that was clicked
   */
  const onInfo = useCallback((node: TreeNode) => {
    selectNode(node)
    setDisplayInfo(true)
  }, [])

  /**
   * Handle node expand/collapse from node component
   */
  const onExpand = useCallback(
    (nodeId: string, expanded: boolean) =>
      setTimeout(() => {
        setExpandedNodes((_) => {
          const next = new Set<string>()
          if (expanded) next.add(nodeId)
          return next
        })
      }, 0),
    []
  )

  /**
   * Set focus to a specific node
   */
  const setFocus = useCallback(
    (nodeId: string) => {
      setFocusOnNode(nodeId)
      setShowAllNodes(false)
      setExpandedNodes(new Set())

      setTimeout(() => {
        const node = reactFlowInstance.getNode(nodeId)
        if (node) {
          setViewingOptionsShown(true)
          reactFlowInstance.setCenter(
            node.position.x + (node.width ?? 0) / 2,
            node.position.y + (node.height ?? 0) / 2,
            { zoom: 1, duration: 300 }
          )
        } else {
          resetView()
        }
      }, 100)
    },
    [reactFlowInstance, resetView]
  )

  /**
   * Adjust generation depth
   */
  const adjustGenerations = useCallback((direction: 'up' | 'down', delta: number) => {
    if (direction === 'up') {
      setGenerationsUp((prev) => Math.max(1, Math.min(prev + delta, 10)))
    } else {
      setGenerationsDown((prev) => Math.max(1, Math.min(prev + delta, 10)))
    }
  }, [])

  /**
   * Toggle show all nodes
   */
  const toggleShowAll = useCallback(() => {
    setShowAllNodes((prev) => {
      const next = !prev
      setTimeout(() => {
        if (next) {
          resetView()
          setViewingOptionsShown(false)
          setFocusOnNode(null)
        } else if (focusOnNode) {
          const node = reactFlowInstance.getNode(focusOnNode)
          if (node) {
            reactFlowInstance.setCenter(
              node.position.x + (node.width ?? 0) / 2,
              node.position.y + (node.height ?? 0) / 2,
              { zoom: 1, duration: 300 }
            )
          } else {
            resetView()
          }
        }
      }, 100)
      return next
    })
  }, [])

  /**
   * Collapse all expanded nodes (triggered on pane click)
   */
  const collapseAllNodes = useCallback(() => setExpandedNodes(new Set()), [])

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

    if (selectedNode) setTimeout(() => selectNode(null), 500)
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
    } = createTreeLayout(
      tree,
      nodes,
      edges,
      selectedNode?.id ?? null,
      onInfo,
      setFocus,
      onExpand,
      viewingOptionsEnabled,
      collapseKey,
      expandedNodes,
      allEdges
    )
    return { nodes: layoutNodes, edges: layoutEdges, spousePairs }
  }, [tree, edges, nodes, onInfo, onExpand])

  const [layoutResult, setLayoutResult] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }>({
    nodes: [],
    edges: [],
  })

  useEffect(() => {
    const compute = async () => {
      const result = await computedLayout(layout.nodes, layout.edges, 'TB')
      setLayoutResult(result)
    }
    compute()
  }, [layout])

  /**
   * Position couple nodes in the layout
   * @return {Node[]} Positioned nodes
   */
  const computedNodes = useMemo(() => positionCoupleNodes(layoutResult.nodes), [layoutResult.nodes])

  /**
   * React Flow nodes state
   */
  const [treeNodes, setTreeNodes, onTreeNodesChange] = useNodesState(computedNodes)
  /**
   * React Flow edges state
   */
  const [treeEdges, setTreeEdges, onTreeEdgesChange] = useEdgesState(layoutResult.edges)

  /**
   * Sync computed nodes and edges with React Flow state
   */
  useEffect(() => {
    setTreeNodes(computedNodes)
    setTreeEdges(layoutResult.edges)
  }, [computedNodes, layoutResult.edges, setTreeNodes, setTreeEdges])

  /**
   * Update node and edge data when expandedNodes changes (without recalculating layout)
   */
  useEffect(() => {
    const highlightedNodes = new Set<string>()
    const highlightedEdges = new Set<string>()

    expandedNodes.forEach((nodeId) => {
      const visited = new Set<string>()
      const findAncestors = (nodeId: string, currentEdges?: any[]) => {
        if (visited.has(nodeId)) return
        visited.add(nodeId)

        allEdges.forEach((edge) => {
          if (edge.toNodeId === nodeId && edge.type !== 'SPOUSE') {
            highlightedEdges.add(`${edge.fromNodeId}->${edge.toNodeId}`)
            highlightedNodes.add(edge.fromNodeId)
            findAncestors(edge.fromNodeId, currentEdges)
          }
        })

        if (currentEdges) {
          const coupleNodeEdges = currentEdges.filter(
            (e) => e.target === nodeId && e.source.startsWith('couple-')
          )
          coupleNodeEdges.forEach((coupleEdge) => {
            highlightedEdges.add(`${coupleEdge.source}->${coupleEdge.target}`)
            currentEdges.forEach((e) => {
              if (e.target === coupleEdge.source) {
                highlightedEdges.add(`${e.source}->${e.target}`)
                highlightedNodes.add(e.source)
                findAncestors(e.source, currentEdges)
              }
            })
          })
        }
      }

      findAncestors(nodeId)
    })

    setTreeNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: highlightedNodes.has(node.id),
          isExpanded: expandedNodes.has(node.id),
        },
      }))
    )

    setTreeEdges((currentEdges) => {
      const allNodes = new Set([...expandedNodes, ...highlightedNodes])

      allNodes.forEach((nodeId) => {
        const coupleNodeEdges = currentEdges.filter(
          (e) => e.target === nodeId && e.source.startsWith('couple-')
        )
        coupleNodeEdges.forEach((coupleEdge) => {
          highlightedEdges.add(`${coupleEdge.source}->${coupleEdge.target}`)
          currentEdges.forEach((e) => {
            if (e.target === coupleEdge.source) highlightedEdges.add(`${e.source}->${e.target}`)
          })
        })
      })

      return currentEdges.map((edge) => {
        const connectionKey = `${edge.source}->${edge.target}`
        const isHighlighted = highlightedEdges.has(connectionKey)
        const isSpouse = edge.data?.type === 'SPOUSE'

        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isHighlighted ? ocean[200] : ocean[100],
            strokeWidth: isSpouse ? 6 : isHighlighted ? 5 : 3,
          },
          zIndex: isHighlighted ? 1000 : 1,
          data: { ...edge.data, isHighlighted },
        }
      })
    })
  }, [expandedNodes, allEdges, setTreeNodes, setTreeEdges])

  /**
   * Handle edge click event (left-click)
   * @param event React mouse event
   * @param edge Edge that was clicked
   * @return void
   */
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: FlowEdge) => {
    event.preventDefault()
    setEdgeContextMenu({ visible: true, x: event.clientX, y: event.clientY, edgeId: edge.id })
  }, [])

  /**
   * Handle edge context menu event (right-click)
   * @param event React mouse event
   * @param edge Edge that was right-clicked
   * @return void
   */
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: FlowEdge) => {
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
  }, [displayInfo])

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

    setViewingOptionsShown: () => setViewingOptionsShown(!viewingOptionsShown),
    viewingOptionsShown,
    viewingOptionsEnabled,
    focusOnNode,
    setFocus,
    generationsUp,
    generationsDown,
    showAllNodes,
    adjustGenerations,
    toggleShowAll,
    totalNodeCount: allNodes.length,
    hiddenCounts,
  }
}
