import dagre from 'dagre'
import { Node, Edge, Position } from 'reactflow'

import { Tree, TreeEdge, TreeNode } from '@/types'

import { ocean } from '@/styles/colors'

const nodeWidth = 220
const nodeHeight = 80

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

/**
 * Compute layout using Dagre
 * @param nodes
 * @param edges
 * @param direction
 * @returns  {nodes: Node[], edges: Edge[]}
 */
export function computedLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((n) => dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight }))

  edges
    .filter((e) => e.data?.type !== 'SPOUSE' && e.type !== 'SPOUSE')
    .forEach((e) => dagreGraph.setEdge(e.source, e.target))

  dagre.layout(dagreGraph)

  const spouseEdges = edges.filter((e) => e.data?.type === 'SPOUSE' || e.type === 'SPOUSE')

  const computedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id) as { x: number; y: number }

    const isSpouseSource = spouseEdges.some((e) => e.source === node.id)
    const isSpouseTarget = spouseEdges.some((e) => e.target === node.id)
    const isSpouse = isSpouseSource || isSpouseTarget

    return {
      ...node,
      targetPosition: !isSpouse ? Position.Top : isSpouseSource ? Position.Left : Position.Right,
      sourcePosition: !isSpouse ? Position.Bottom : isSpouseSource ? Position.Right : Position.Left,

      position: {
        x: nodeWithPosition ? nodeWithPosition.x - nodeWidth / 2 : 0,
        y: nodeWithPosition ? nodeWithPosition.y - nodeHeight / 2 : 0,
      },
    }
  })

  spouseEdges.forEach((e) => {
    const source = computedNodes.find((n) => n.id === e.source)
    const target = computedNodes.find((n) => n.id === e.target)
    if (source && target)
      target.position = { x: source.position.x + nodeWidth + 40, y: source.position.y }
  })

  const computedEdges: Edge[] = edges.map((e) => {
    const isSpouse = e.data?.type === 'SPOUSE' || e.type === 'SPOUSE'
    return {
      ...e,
      type: 'smoothstep',
      animated: true,
      sourceHandle: isSpouse ? 'right' : 'bottom',
      targetHandle: isSpouse ? 'left' : 'top',
      style: { stroke: ocean[100], strokeWidth: 3 },
    }
  })

  return { nodes: computedNodes, edges: computedEdges }
}

/**
 * Create tree layout
 * @param tree {Tree}
 * @param nodes {TreeNode[]}
 * @param edges {TreeEdge[]}
 * @param selectedNodeId {string}
 * @param onInfo {(node: TreeNode) => void}
 * @param collapseKey {number} - Key to trigger collapse of all expanded nodes
 */
export function createTreeLayout(
  tree: Tree,
  nodes: TreeNode[],
  edges: TreeEdge[],
  selectedNodeId: string | null,
  onInfo: (node: TreeNode) => void,
  collapseKey: number = 0
) {
  const treeEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.fromNodeId,
    target: edge.toNodeId,
    type: 'smoothstep',
    animated: true,
    data: { type: edge.type },
  }))

  const treeNodes: Node[] = nodes.map((node) => {
    const edgesFrom = edges.filter((e) => e.fromNodeId === node.id)
    const edgesTo = edges.filter((e) => e.toNodeId === node.id)
    return {
      id: node.id,
      type: tree.type,
      data: {
        node: { ...node, edgesFrom, edgesTo },
        withPicture: tree.nodeImage,
        selectedNodeId: selectedNodeId,
        onInfo: onInfo,
        collapseKey: collapseKey,
      },
      position: { x: 0, y: 0 },
    }
  })

  const coupleNodes: Node[] = []
  const coupleEdges: Edge[] = []

  const spouseEdges = treeEdges.filter((e) => e.data?.type === 'SPOUSE')
  let edgeCounter = 0

  const spousePairs = new Map<string, { spouse1: string; spouse2: string; children: string[] }>()

  spouseEdges.forEach((edge) => {
    const sharedChildren = edges
      .filter((e) => {
        if (e.type === 'SPOUSE') return false

        const childId = e.toNodeId
        const childParents = edges
          .filter(
            (parentEdge) =>
              (parentEdge.type === 'PARENT' || parentEdge.type === 'CHILD') &&
              parentEdge.toNodeId === childId
          )
          .map((parentEdge) => parentEdge.fromNodeId)

        return childParents.includes(edge.source) && childParents.includes(edge.target)
      })
      .map((e) => e.toNodeId)

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
  })

  spousePairs.forEach(({ spouse1, spouse2, children }, pairId) => {
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
      type: 'smoothstep',
      animated: false,
    })

    coupleEdges.push({
      id: `edge-${spouse2}-${coupleNodeId}-${edgeCounter++}`,
      source: spouse2,
      target: coupleNodeId,
      type: 'smoothstep',
      animated: false,
    })

    children.forEach((childId) => {
      coupleEdges.push({
        id: `edge-${coupleNodeId}-${childId}-${edgeCounter++}`,
        source: coupleNodeId,
        target: childId,
        type: 'smoothstep',
        animated: false,
      })
    })
  })

  const edgesWithoutSharedChildren = treeEdges.filter((e) => {
    if (e.data?.type === 'SPOUSE') {
      const pairId = [e.source, e.target].sort().join('-')
      return !spousePairs.has(pairId)
    }

    for (const [pairId, { spouse1, spouse2, children }] of spousePairs) {
      if ((e.source === spouse1 || e.source === spouse2) && children.includes(e.target)) {
        return false
      }
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
 * @param spousePairs
 * @returns {Node[]} Positioned nodes
 */
export function positionCoupleNodes(layoutNodes: Node[], spousePairs: Map<string, any>): Node[] {
  return layoutNodes.map((node) => {
    if (node.id.startsWith('couple-')) {
      const pairId = node.id.replace('couple-', '')
      const [spouse1Id, spouse2Id] = pairId.split('-')

      const spouse1 = layoutNodes.find((n) => n.id === spouse1Id)
      const spouse2 = layoutNodes.find((n) => n.id === spouse2Id)

      if (spouse1 && spouse2) {
        const leftSpouse = spouse1.position.x < spouse2.position.x ? spouse1 : spouse2
        const rightSpouse = spouse1.position.x < spouse2.position.x ? spouse2 : spouse1

        const leftSpouseCenter = leftSpouse.position.x + nodeWidth / 2
        const rightSpouseCenter = rightSpouse.position.x + nodeWidth / 2
        const actualMidX = (leftSpouseCenter + rightSpouseCenter) / 2

        const midY = Math.max(spouse1.position.y, spouse2.position.y)

        return { ...node, position: { x: actualMidX - 0.5, y: midY + nodeHeight + 50 } }
      }
    }
    return node
  })
}

export { nodeWidth, nodeHeight }
