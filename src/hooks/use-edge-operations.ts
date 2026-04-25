'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as Sentry from '@sentry/nextjs'
import { toast } from 'sonner'
import { Connection, Edge, addEdge } from 'reactflow'

import {
  createTreeEdge,
  deleteTreeEdge,
  createUnion,
  deleteUnion,
  attachChildToUnion,
} from '@/server/actions'

import { decideChildAttachment } from '@/hooks/child-attach-decision'

import { isCoupleId } from '@/components/tree/layout'

import { TreeEdge, TreeEdgeType, Tree, TreeNode, Union } from '@/types'

import { ocean } from '@/styles/colors'

export interface UnionPickRequest {
  parentId: string
  childId: string
  candidates: Union[]
}

export function useEdgeOperations(
  tree: Tree,
  edges: TreeEdge[],
  unions: Union[],
  nodes: TreeNode[],
  treeEdges: Edge[],
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void,
  onUnionPickNeeded?: (req: {
    parentId: string
    childId: string
    candidates: Union[]
  }) => void,
  onSpouseUnionConfirmNeeded?: (req: { spouseAId: string; spouseBId: string }) => void
) {
  const t_toasts = useTranslations('toasts')
  const t_errors = useTranslations('errors')
  const router = useRouter()

  const validateConnection = useCallback(
    (conn: Connection, edgeType: TreeEdgeType): string | null => {
      if (!conn.source || !conn.target) return 'error'
      if (conn.source === conn.target) return 'error-cannot-connect-to-self'

      const existing = treeEdges.find(
        (e) =>
          (e.source === conn.source && e.target === conn.target) ||
          (e.source === conn.target && e.target === conn.source)
      )
      if (existing) return 'error-relationship-already-exists'

      if (edgeType === 'PARENT' || edgeType === 'CHILD') {
        const getParents = (nodeId: string): string[] =>
          edges
            .filter((e) => e.toNodeId === nodeId && (e.type === 'PARENT' || e.type === 'CHILD'))
            .map((e) => e.fromNodeId)

        const sourceParents = getParents(conn.source)
        const targetParents = getParents(conn.target)
        const shared = sourceParents.filter((p) => targetParents.includes(p))
        if (shared.length > 0) return 'error-cannot-connect-siblings'

        if (edgeType === 'PARENT' && getParents(conn.target).length >= 2)
          return 'error-child-has-max-parents'
        if (edgeType === 'CHILD' && getParents(conn.source).length >= 2)
          return 'error-child-has-max-parents'
      }

      return null
    },
    [treeEdges, edges]
  )

  const attachChildToBestUnion = useCallback(
    async (parentId: string, childId: string) => {
      const decision = decideChildAttachment(parentId, childId, nodes, unions, edges)

      if (decision.kind === 'noop') return

      if (decision.kind === 'create-single-parent-union') {
        const { error, unionId } = await createUnion({
          treeId: tree.id,
          spouseAId: parentId,
          spouseBId: null,
        })
        if (error || !unionId) return
        await attachChildToUnion({ treeId: tree.id, unionId, childNodeId: childId })
        return
      }

      if (decision.kind === 'attach-to-existing-union') {
        await attachChildToUnion({
          treeId: tree.id,
          unionId: decision.unionId,
          childNodeId: childId,
        })
        return
      }

      if (decision.kind === 'prompt' && onUnionPickNeeded) {
        onUnionPickNeeded({ parentId, childId, candidates: decision.candidates })
      }
    },
    [nodes, unions, edges, tree.id, onUnionPickNeeded]
  )

  const onConnect = useCallback(
    async (conn: Connection) => {
      if (!conn.source || !conn.target) return

      let edgeType: TreeEdgeType = 'PARENT'
      if (
        (conn.sourceHandle === 'right' || conn.sourceHandle === 'left') &&
        (conn.targetHandle === 'left' || conn.targetHandle === 'right')
      )
        edgeType = 'SPOUSE'
      else if (conn.targetHandle === 'top') edgeType = 'PARENT'
      else if (conn.targetHandle === 'bottom') edgeType = 'CHILD'

      const validationError = validateConnection(conn, edgeType)
      if (validationError) {
        toast.error(t_errors(validationError))
        return
      }

      const newEdge = {
        ...conn,
        type: 'smoothstep',
        style: { stroke: ocean[100], strokeWidth: 3 },
      }

      try {
        if (edgeType === 'SPOUSE') {
          if (onSpouseUnionConfirmNeeded) {
            onSpouseUnionConfirmNeeded({ spouseAId: conn.source, spouseBId: conn.target })
            return
          }

          // fallback path for callers that don't pass the confirm callback
          const { error, message } = await createTreeEdge({
            treeId: tree.id,
            fromNodeId: conn.source,
            toNodeId: conn.target,
            type: 'SPOUSE',
          })
          if (error) {
            toast.error(t_errors(message || 'error'))
            return
          }
          await createUnion({
            treeId: tree.id,
            spouseAId: conn.source,
            spouseBId: conn.target,
          })
          toast.success(t_toasts('edge-created'))
          router.refresh()
          return
        }

        if (edgeType === 'PARENT' || edgeType === 'CHILD') {
          const parentNodeId = edgeType === 'PARENT' ? conn.source : conn.target
          const childNodeId = edgeType === 'PARENT' ? conn.target : conn.source

          const { error, message } = await createTreeEdge({
            treeId: tree.id,
            fromNodeId: conn.source,
            toNodeId: conn.target,
            type: edgeType,
          })
          if (error) {
            toast.error(t_errors(message || 'error'))
            return
          }

          await attachChildToBestUnion(parentNodeId, childNodeId)

          setEdges((i) => addEdge(newEdge, i))
          toast.success(t_toasts('edge-created'))
          router.refresh()
          return
        }
      } catch (_error) {
        toast.error(t_errors('error'))
      }
    },
    [
      setEdges,
      tree.id,
      t_errors,
      t_toasts,
      validateConnection,
      attachChildToBestUnion,
      router,
      onSpouseUnionConfirmNeeded,
    ]
  )

  const deleteEdge = useCallback(
    async (edgeId: string, closeContextMenu: () => void) => {
      try {
        // synthetic couple-bus edge ids: `ue:<unionId>:a|b|c:<childId>`
        if (edgeId.startsWith('ue:')) {
          const parts = edgeId.split(':')
          const unionId = parts[1]
          const kind = parts[2]

          if (kind === 'a' || kind === 'b') {
            const { error, message } = await deleteUnion(unionId, tree.id)
            if (error) toast.error(t_errors(message || 'error'))
            else {
              toast.success(t_toasts('edge-deleted'))
              router.refresh()
            }
          } else if (kind === 'c') {
            const childId = parts.slice(3).join(':')
            const { error, message } = await attachChildToUnion({
              treeId: tree.id,
              unionId: null,
              childNodeId: childId,
            })
            if (error) toast.error(t_errors(message || 'error'))
            else {
              toast.success(t_toasts('edge-deleted'))
              router.refresh()
            }
          }
          closeContextMenu()
          return
        }

        const dbEdge = edges.find((e) => e.id === edgeId)
        if (!dbEdge) {
          toast.error(t_errors('error-edge-not-found'))
          closeContextMenu()
          return
        }

        const { error, message } = await deleteTreeEdge(dbEdge.id, tree.id)
        if (error) toast.error(t_errors(message || 'error'))
        else {
          toast.success(t_toasts('edge-deleted'))

          if (dbEdge.type === 'SPOUSE') {
            const union = unions.find(
              (u) =>
                (u.spouseAId === dbEdge.fromNodeId && u.spouseBId === dbEdge.toNodeId) ||
                (u.spouseAId === dbEdge.toNodeId && u.spouseBId === dbEdge.fromNodeId)
            )
            if (union) await deleteUnion(union.id, tree.id)
          }

          router.refresh()
        }
      } catch (e) {
        Sentry.captureException(e, { tags: { action: 'deleteEdge' } })
        toast.error(t_errors('error'))
      }
      closeContextMenu()
    },
    [edges, unions, tree.id, t_errors, t_toasts, router]
  )

  void isCoupleId

  return { onConnect, deleteEdge, attachChildToBestUnion }
}
