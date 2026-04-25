import type { TreeEdge, TreeNode, Union } from '@/types'

export type ChildAttachDecision =
  | { kind: 'noop' }
  | { kind: 'create-single-parent-union' }
  | { kind: 'attach-to-existing-union'; unionId: string }
  | { kind: 'prompt'; candidates: Union[] }

export function decideChildAttachment(
  parentId: string,
  childId: string,
  nodes: TreeNode[],
  unions: Union[],
  edges: TreeEdge[]
): ChildAttachDecision {
  const child = nodes.find((n) => n.id === childId)
  if (!child || child.childOfUnionId) return { kind: 'noop' }

  const parentUnions = unions.filter(
    (u) => u.spouseAId === parentId || u.spouseBId === parentId
  )

  if (parentUnions.length === 0) return { kind: 'create-single-parent-union' }

  if (parentUnions.length === 1)
    return { kind: 'attach-to-existing-union', unionId: parentUnions[0].id }

  const isParentOfChild = (nodeId: string) =>
    edges.some(
      (e) =>
        (e.type === 'PARENT' || e.type === 'CHILD') &&
        ((e.fromNodeId === nodeId && e.toNodeId === childId) ||
          (e.fromNodeId === childId && e.toNodeId === nodeId))
    )

  const compatible = parentUnions.filter((u) => {
    const other = u.spouseAId === parentId ? u.spouseBId : u.spouseAId
    return !other || isParentOfChild(other)
  })

  if (compatible.length === 1)
    return { kind: 'attach-to-existing-union', unionId: compatible[0].id }

  return {
    kind: 'prompt',
    candidates: compatible.length > 0 ? compatible : parentUnions,
  }
}
