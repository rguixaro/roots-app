import dagre from '@dagrejs/dagre'
import { Node, Edge, Position } from 'reactflow'

import { Tree, TreeEdge, TreeNode } from '@/types'

import { ocean } from '@/styles/colors'

const nodeWidth = 208
const nodeHeight = 80

/**
 * Get node width based on type and content
 * @param node {Node} - Node to calculate width for
 * @returns {number} - Calculated width
 */
function getNodeWidth(node: Node): number {
  const name = node.data?.node?.fullName || node.data?.node?.name || ''
  if (name.length <= 15) {
    const charWidth = 9
    const padding = 80
    const estimatedWidth = Math.max(nodeWidth, name.length * charWidth + padding)
    return Math.min(estimatedWidth, nodeWidth)
  }

  return nodeWidth
}

/**
 * Calculate which nodes should be visible based on focus node and generation depth
 * @param allNodes {TreeNode[]} - All nodes in the tree
 * @param allEdges {TreeEdge[]} - All edges in the tree
 * @param focusOnNode {string | null} - Node id to focus on
 * @param generationsUp {number} - Number of generations to show above focus node
 * @param generationsDown {number} - Number of generations to show below focus node
 * @param expandedNodes {Set<string>} - Set of node ids that are expanded
 * @returns {{ nodes: TreeNode[]; edges: TreeEdge[]; hiddenCounts: Map<string, { parents: number; children: number }> }} - Visible nodes, edges, and hidden counts
 */
export function getVisibleNodesAndEdges(
  allNodes: TreeNode[],
  allEdges: TreeEdge[],
  focusOnNode: string | null,
  generationsUp: number = 2,
  generationsDown: number = 2,
  expandedNodes: Set<string> = new Set()
): {
  nodes: TreeNode[]
  edges: TreeEdge[]
  hiddenCounts: Map<string, { parents: number; children: number }>
} {
  if (!focusOnNode || allNodes.length === 0)
    return { nodes: allNodes, edges: allEdges, hiddenCounts: new Map() }

  const visible = new Set<string>([focusOnNode])
  const hiddenCounts = new Map<string, { parents: number; children: number }>()

  /**
   * Helper to get related parent nodes
   * @param nodeId {string} - Node id
   * @returns {string[]} Parent nodes ids
   */
  const getParents = (nodeId: string): string[] =>
    allEdges.filter((e) => e.toNodeId === nodeId && e.type !== 'SPOUSE').map((e) => e.fromNodeId)

  /**
   * Helper to get related children nodes
   * @param nodeId {string} - Node id
   * @returns {string[]} Children node ids
   */
  const getChildren = (nodeId: string): string[] =>
    allEdges.filter((e) => e.fromNodeId === nodeId && e.type !== 'SPOUSE').map((e) => e.toNodeId)

  /**
   * Helper to get related spouse nodes
   * @param nodeId {string} - Node id
   * @returns {string[]} Spouse node ids
   */
  const getSpouses = (nodeId: string): string[] =>
    allEdges
      .filter((e) => e.type === 'SPOUSE' && (e.fromNodeId === nodeId || e.toNodeId === nodeId))
      .map((e) => (e.fromNodeId === nodeId ? e.toNodeId : e.fromNodeId))

  let currentLevel = [focusOnNode]
  for (let i = 0; i < generationsUp; i++) {
    const nextLevel: string[] = []
    currentLevel.forEach((nodeId) => {
      const parents = getParents(nodeId)
      parents.forEach((p) => {
        visible.add(p)
        nextLevel.push(p)
        getSpouses(p).forEach((s) => visible.add(s))
      })
    })
    currentLevel = nextLevel
  }

  currentLevel = [focusOnNode]
  for (let i = 0; i < generationsDown; i++) {
    const nextLevel: string[] = []
    currentLevel.forEach((nodeId) => {
      const isExpanded = expandedNodes.has(nodeId)
      const children = getChildren(nodeId)

      children.forEach((c) => {
        if (isExpanded || i < generationsDown - 1) {
          visible.add(c)
          nextLevel.push(c)
        }
      })
    })
    currentLevel = nextLevel
  }

  getSpouses(focusOnNode).forEach((s) => visible.add(s))

  visible.forEach((nodeId) => {
    const allParents = getParents(nodeId)
    const visibleParents = allParents.filter((p) => visible.has(p))
    const hiddenParents = allParents.length - visibleParents.length

    const allChildren = getChildren(nodeId)
    const visibleChildren = allChildren.filter((c) => visible.has(c))
    const hiddenChildren = allChildren.length - visibleChildren.length

    if (hiddenParents > 0 || hiddenChildren > 0)
      hiddenCounts.set(nodeId, { parents: hiddenParents, children: hiddenChildren })
  })

  const visibleNodes = allNodes.filter((n) => visible.has(n.id))
  const visibleEdges = allEdges.filter((e) => visible.has(e.fromNodeId) && visible.has(e.toNodeId))

  return { nodes: visibleNodes, edges: visibleEdges, hiddenCounts }
}

/**
 * Compute layout using dagre
 * @param nodes {Node[]} - Nodes to layout
 * @param edges {Edge[]} - Edges to layout
 * @param direction {'TB' | 'LR'} - Layout direction (Top-Bottom or Left-Right)
 * @returns { nodes: Node[]; edges: Edge[] } - Computed nodes and edges with positions
 */
export async function computedLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const dagreGraph = new dagre.graphlib.Graph()

  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 80,
    edgesep: 80,
    marginx: 50,
    marginy: 50,
    ranker: 'tight-tree',
  })

  const spouseEdges: Edge[] = []
  const parentChildEdges: Edge[] = []

  for (const e of edges) {
    if (e.data?.type === 'SPOUSE' || e.type === 'SPOUSE') spouseEdges.push(e)
    else parentChildEdges.push(e)
  }

  const spouseMap = new Map<string, string>()
  for (const e of spouseEdges) {
    spouseMap.set(e.source, e.target)
    spouseMap.set(e.target, e.source)
  }

  const addedNodes = new Set<string>()
  const spousePairMap = new Map<
    string,
    { primary: string; spouse: string; primaryWidth: number; spouseWidth: number }
  >()

  const spousePairOrder = new Map<string, { left: string; right: string }>()
  for (const e of spouseEdges) {
    const pairKey = [e.source, e.target].sort().join('-')
    if (!spousePairOrder.has(pairKey))
      spousePairOrder.set(pairKey, { left: e.source, right: e.target })
  }

  for (const node of nodes) {
    if (addedNodes.has(node.id)) continue

    const spouseId = spouseMap.get(node.id)

    if (spouseId && !addedNodes.has(spouseId)) {
      const pairKey = [node.id, spouseId].sort().join('-')
      const order = spousePairOrder.get(pairKey)!

      const leftNode = nodes.find((n) => n.id === order.left)!
      const rightNode = nodes.find((n) => n.id === order.right)!

      const primaryWidth = getNodeWidth(leftNode)
      const spouseWidth = getNodeWidth(rightNode)
      const combinedWidth = primaryWidth + spouseWidth + 40

      dagreGraph.setNode(order.left, { width: combinedWidth, height: nodeHeight })
      spousePairMap.set(order.left, {
        primary: order.left,
        spouse: order.right,
        primaryWidth,
        spouseWidth,
      })
      addedNodes.add(order.left)
      addedNodes.add(order.right)
    } else if (!spouseId) {
      const width = getNodeWidth(node)
      dagreGraph.setNode(node.id, { width, height: nodeHeight })
      addedNodes.add(node.id)
    }
  }

  for (const edge of parentChildEdges) {
    let source = edge.source
    let target = edge.target

    for (const [primary, { spouse }] of spousePairMap) {
      if (edge.source === spouse) source = primary
      if (edge.target === spouse) target = primary
    }

    if (!dagreGraph.hasEdge(source, target)) dagreGraph.setEdge(source, target)
  }

  dagre.layout(dagreGraph)

  const computedNodes: Node[] = []
  const gap = 80

  for (const node of nodes) {
    const spousePair = spousePairMap.get(node.id)
    if (!spousePair) {
      const isSpouse = Array.from(spousePairMap.values()).some((p) => p.spouse === node.id)
      if (!isSpouse) {
        const dagreNode = dagreGraph.node(node.id)
        if (dagreNode) {
          const width = getNodeWidth(node)
          computedNodes.push({
            ...node,
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: { x: dagreNode.x - width / 2, y: dagreNode.y - nodeHeight / 2 },
          })
        }
      }
    } else {
      const dagreNode = dagreGraph.node(node.id)!
      const centerX = dagreNode.x
      const centerY = dagreNode.y
      const primaryWidth = spousePair.primaryWidth
      const spouseWidth = spousePair.spouseWidth
      const leftEdge = centerX - (primaryWidth + spouseWidth + gap) / 2

      const nodesInMarriage: Node[] = [
        nodes.find((n) => n.id === spousePair.primary)!,
        nodes.find((n) => n.id === spousePair.spouse)!,
      ]

      for (let idx = 0; idx < 2; idx++) {
        const n = nodesInMarriage[idx]
        const x = leftEdge + (idx === 0 ? 0 : primaryWidth + gap)
        computedNodes.push({
          ...n,
          targetPosition: Position.Top,
          sourcePosition: Position.Bottom,
          position: { x, y: centerY - nodeHeight / 2 },
          style: { zIndex: 1000 },
        })
      }
    }
  }

  const computedEdges: Edge[] = edges.map((e) => {
    const isSpouse = e.data?.type === 'SPOUSE' || e.type === 'SPOUSE'

    if (isSpouse) {
      let sourceHandle = 'right'
      let targetHandle = 'left'

      const sourcePair = spousePairMap.get(e.source)
      if (sourcePair && sourcePair.spouse === e.target) {
        sourceHandle = 'right'
        targetHandle = 'left'
      } else {
        const targetPair = spousePairMap.get(e.target)
        if (targetPair && targetPair.spouse === e.source) {
          sourceHandle = 'left'
          targetHandle = 'right'
        }
      }

      return { ...e, sourceHandle, targetHandle, style: { stroke: ocean[100], strokeWidth: 5 } }
    }

    return {
      ...e,
      type: 'smoothstep',
      animated: false,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      style: { stroke: ocean[100], strokeWidth: 3 },
    }
  })

  const finalNodes = applySiblingGroupOffsets(computedNodes, 16)

  return { nodes: finalNodes, edges: computedEdges }
}

/**
 * Create tree layout
 * @param tree {Tree}
 * @param nodes {TreeNode[]}
 * @param edges {TreeEdge[]}
 * @param selectedNodeId {string}
 * @param onInfo {(node: TreeNode) => void}
 * @param onFocus {(node: string) => void}
 * @param onExpand {(nodeId: string, expanded: boolean) => void}
 * @param collapseKey {number} - Key to trigger collapse of all expanded nodes
 * @param expandedNodes {Set<string>} - Set of node ids that are expanded
 * @param allEdges {TreeEdge[]} - All edges in the tree for ancestor calculation
 */
export function createTreeLayout(
  tree: Tree,
  nodes: TreeNode[],
  edges: TreeEdge[],
  selectedNodeId: string | null,
  onInfo: (node: TreeNode) => void,
  onFocus: (node: string) => void,
  onExpand: (nodeId: string, expanded: boolean) => void,
  focusEnabled: boolean = false,
  collapseKey: number = 0,
  expandedNodes: Set<string> = new Set(),
  allEdges: TreeEdge[] = []
) {
  const treeEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.fromNodeId,
    target: edge.toNodeId,
    type: 'smoothstep',
    animated: true,
    data: { type: edge.type },
  }))

  const highlightedNodes = new Set<string>()
  expandedNodes.forEach((nodeId) => {
    const parents = allEdges
      .filter((e) => e.toNodeId === nodeId && e.type !== 'SPOUSE')
      .map((e) => e.fromNodeId)
    parents.forEach((parentId) => highlightedNodes.add(parentId))
  })

  const treeNodes: Node[] = nodes.map((node) => {
    const edgesFrom = edges.filter((e) => e.fromNodeId === node.id)
    const edgesTo = edges.filter((e) => e.toNodeId === node.id)

    return {
      id: node.id,
      type: 'DEFAULT',
      data: {
        node: { ...node, edgesFrom, edgesTo },
        selectedNodeId: selectedNodeId,
        onInfo: onInfo,
        onFocus: focusEnabled ? onFocus : null,
        onExpand: onExpand,
        collapseKey: collapseKey,
        isHighlighted: highlightedNodes.has(node.id),
        isExpanded: expandedNodes.has(node.id),
      },
      position: { x: 0, y: 0 },
    }
  })

  const coupleNodes: Node[] = []
  const coupleEdges: Edge[] = []
  const spouseEdges = treeEdges.filter((e) => e.data?.type === 'SPOUSE')
  let edgeCounter = 0

  const spousePairs = new Map<string, { spouse1: string; spouse2: string; children: string[] }>()

  for (const edge of spouseEdges) {
    const sharedChildren: string[] = []

    for (const e of edges) {
      if (e.type === 'SPOUSE') continue

      const childId = e.toNodeId
      const childParents: string[] = []

      for (const pEdge of edges) {
        if ((pEdge.type === 'PARENT' || pEdge.type === 'CHILD') && pEdge.toNodeId === childId)
          childParents.push(pEdge.fromNodeId)
      }

      if (childParents.includes(edge.source) && childParents.includes(edge.target))
        sharedChildren.push(childId)
    }

    if (sharedChildren.length > 0) {
      const pairId = [edge.source, edge.target].sort().join('-')
      if (!spousePairs.has(pairId)) {
        spousePairs.set(pairId, {
          spouse1: edge.source,
          spouse2: edge.target,
          children: sharedChildren,
        })
      }
    }
  }

  for (const node of nodes) {
    const childrenOfParent: string[] = []

    for (const e of edges) {
      if ((e.type === 'PARENT' || e.type === 'CHILD') && e.fromNodeId === node.id) {
        childrenOfParent.push(e.toNodeId)
      }
    }

    if (childrenOfParent.length === 0) continue

    const alreadyPaired = Array.from(spousePairs.values()).some(
      (p) => p.spouse1 === node.id || p.spouse2 === node.id
    )

    if (alreadyPaired) continue

    const pairId = `${node.id}-__single__`
    spousePairs.set(pairId, {
      spouse1: node.id,
      spouse2: null as any,
      children: childrenOfParent,
    })
  }

  for (const [pairId, { spouse1, spouse2, children }] of spousePairs) {
    const coupleNodeId = `couple-${pairId}`

    coupleNodes.push({
      id: coupleNodeId,
      type: 'COUPLE',
      data: { spouse1, spouse2 },
      position: { x: 0, y: 0 },
    })

    coupleEdges.push({
      id: `edge-${spouse1}-${coupleNodeId}-${edgeCounter++}`,
      source: spouse1,
      target: coupleNodeId,
    })

    if (spouse2) {
      coupleEdges.push({
        id: `edge-${spouse2}-${coupleNodeId}-${edgeCounter++}`,
        source: spouse2,
        target: coupleNodeId,
      })
    }

    for (const childId of children) {
      coupleEdges.push({
        id: `edge-${coupleNodeId}-${childId}-${edgeCounter++}`,
        source: coupleNodeId,
        target: childId,
      })
    }
  }

  const edgesWithoutSharedChildren = treeEdges.filter((e) => {
    for (const [_, { spouse1, spouse2, children }] of spousePairs) {
      if ((e.source === spouse1 || e.source === spouse2) && children.includes(e.target))
        return false
    }

    return true
  })

  return {
    nodes: [...treeNodes, ...coupleNodes],
    edges: [...edgesWithoutSharedChildren, ...coupleEdges],
    spousePairs,
  }
}

/**
 * Position couple nodes in the layout
 * @param layoutNodes
 * @returns {Node[]} Positioned nodes
 */
export function positionCoupleNodes(layoutNodes: Node[]): Node[] {
  return layoutNodes.map((node) => {
    if (node.id.startsWith('couple-')) {
      const pairId = node.id.replace('couple-', '')
      const [spouse1Id, spouse2Id] = pairId.split('-')

      const spouse1 = layoutNodes.find((n) => n.id === spouse1Id)
      const spouse2 = layoutNodes.find((n) => n.id === spouse2Id)

      if (spouse1 && spouse2) {
        const leftSpouse = spouse1.position.x < spouse2.position.x ? spouse1 : spouse2
        const rightSpouse = spouse1.position.x < spouse2.position.x ? spouse2 : spouse1

        const leftWidth = getNodeWidth(leftSpouse)
        const rightWidth = getNodeWidth(rightSpouse)

        const leftSpouseCenter = leftSpouse.position.x + leftWidth / 2
        const rightSpouseCenter = rightSpouse.position.x + rightWidth / 2
        const actualMidX = (leftSpouseCenter + rightSpouseCenter) / 2

        const midY = Math.max(spouse1.position.y, spouse2.position.y)

        return { ...node, position: { x: actualMidX - 0.5, y: midY + nodeHeight + 80 } }
      }
    }
    return node
  })
}

export { nodeWidth, nodeHeight }

/**
 * Apply Y-offsets to sibling groups to prevent edge merging
 * @param nodes {Node[]} - Nodes to adjust
 * @param offsetIncrement {number} - Offset increment value
 * @returns {Node[]} - Adjusted nodes
 */
export function applySiblingGroupOffsets(nodes: Node[], offsetIncrement: number = 24): Node[] {
  const nodesByY = new Map<number, Node[]>()

  for (const node of nodes) {
    if (node.id.startsWith('couple-')) continue

    const y = Math.round(node.position.y)
    const level = nodesByY.get(y)
    if (level) level.push(node)
    else nodesByY.set(y, [node])
  }

  for (const levelNodes of nodesByY.values()) {
    if (levelNodes.length <= 1) continue

    const siblingGroups = new Map<string, Node[]>()

    for (const node of levelNodes) {
      const edgesTo = node.data.node.edgesTo
      const parentIds = edgesTo
        ? edgesTo
            .filter((e: TreeEdge) => e.type === 'PARENT' || e.type === 'CHILD')
            .map((e: TreeEdge) => e.fromNodeId)
            .sort()
            .join(',')
        : ''

      const groupKey = parentIds || `no-parents-${node.id}`
      const group = siblingGroups.get(groupKey)
      if (group) group.push(node)
      else siblingGroups.set(groupKey, [node])
    }

    if (siblingGroups.size <= 1) continue

    const sortedGroups = Array.from(siblingGroups.values())
      .map((group) => {
        let sumX = 0
        for (const n of group) sumX += n.position.x
        return { nodes: group, avgX: sumX / group.length }
      })
      .sort((a, b) => a.avgX - b.avgX)

    const numGroups = sortedGroups.length
    const startOffset = -((numGroups - 1) * offsetIncrement) / 2

    for (let i = 0; i < numGroups; i++) {
      const offset = startOffset + i * offsetIncrement
      for (const node of sortedGroups[i].nodes) {
        node.position.y += offset
      }
    }
  }

  return nodes
}
