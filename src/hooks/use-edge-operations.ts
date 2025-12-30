'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Connection, Edge, addEdge } from 'reactflow'

import { createTreeEdge, deleteTreeEdge } from '@/server/actions'

import { TreeEdge, TreeEdgeType, Tree } from '@/types'

import { ocean } from '@/styles/colors'

export function useEdgeOperations(
  tree: Tree,
  edges: TreeEdge[],
  treeEdges: Edge[],
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void
) {
  const t_toasts = useTranslations('toasts')
  const t_errors = useTranslations('errors')
  /**
   * Find the spouse/partner of a given node id
   * @param nodeId - The id of the node whose spouse to find
   * @returns The spouse's node id, or null if not found
   */
  const findSpouse = useCallback(
    (nodeId: string) => {
      const spouseEdge = edges.find(
        (edge) => edge.type === 'SPOUSE' && (edge.fromNodeId === nodeId || edge.toNodeId === nodeId)
      )

      if (!spouseEdge) return null
      return spouseEdge.fromNodeId === nodeId ? spouseEdge.toNodeId : spouseEdge.fromNodeId
    },
    [edges]
  )

  /**
   * Validate a proposed connection between two nodes
   * @param conn - The connection object containing source and target node ids
   * @param edgeType - The type of relationship being created
   * @returns An error message string if invalid, or null if valid
   */
  const validateConnection = useCallback(
    (conn: Connection, edgeType: TreeEdgeType): string | null => {
      if (!conn.source || !conn.target) return 'Invalid connection'

      if (conn.source === conn.target) return 'error-cannot-connect-to-self'

      const existingEdge = treeEdges.find(
        (edge) =>
          (edge.source === conn.source && edge.target === conn.target) ||
          (edge.source === conn.target && edge.target === conn.source)
      )

      if (existingEdge) return 'error-relationship-already-exists'

      if (edgeType === 'PARENT' || edgeType === 'CHILD') {
        const checkForCycle = (
          startNode: string,
          targetNode: string,
          visited = new Set<string>()
        ): boolean => {
          if (startNode === targetNode) return true
          if (visited.has(startNode)) return false

          visited.add(startNode)

          for (const e of treeEdges) {
            if (e.data?.type === 'SPOUSE') continue

            if (edgeType === 'PARENT' ? e.source === startNode : e.target === startNode) {
              const nextNode = edgeType === 'PARENT' ? e.target : e.source
              if (checkForCycle(nextNode, targetNode, new Set(visited))) return true
            }
          }

          return false
        }

        const wouldCreateCycle =
          edgeType === 'PARENT'
            ? checkForCycle(conn.target, conn.source)
            : checkForCycle(conn.source, conn.target)

        if (wouldCreateCycle) return 'error-would-create-cycle'

        const getParents = (nodeId: string): string[] => {
          return edges
            .filter((e) => e.toNodeId === nodeId && (e.type === 'PARENT' || e.type === 'CHILD'))
            .map((e) => e.fromNodeId)
        }

        const sourceParents = getParents(conn.source)
        const targetParents = getParents(conn.target)

        const sharedParents = sourceParents.filter((parent) => targetParents.includes(parent))
        if (sharedParents.length > 0) return 'error-cannot-connect-siblings'

        if (edgeType === 'PARENT') {
          const childParents = getParents(conn.target)
          if (childParents.length >= 2) return 'error-child-has-max-parents'
        } else if (edgeType === 'CHILD') {
          const childParents = getParents(conn.source)
          if (childParents.length >= 2) return 'error-child-has-max-parents'
        }
      }

      return null
    },
    [treeEdges, edges]
  )

  /**
   * Handle new edge connections between nodes
   * @param conn - The connection object containing source and target node ids
   * @return {Promise<void>}
   */
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
        type: 'simplebezier',
        style: { stroke: ocean[400], strokeWidth: 2 },
      }

      try {
        if (edgeType === 'PARENT' || edgeType === 'CHILD') {
          const parentNodeId = edgeType === 'PARENT' ? conn.source : conn.target
          const childNodeId = edgeType === 'PARENT' ? conn.target : conn.source

          const parentSpouse = findSpouse(parentNodeId)

          const { error: primaryError, message: primaryMessage } = await createTreeEdge({
            treeId: tree.id,
            fromNodeId: conn.source,
            toNodeId: conn.target,
            type: edgeType,
          })

          if (primaryError) {
            toast.error(t_errors(primaryMessage || 'error'))
            return
          }

          if (parentSpouse) {
            const existingSpouseChildEdge = edges.find(
              (e) =>
                (e.type === 'PARENT' || e.type === 'CHILD') &&
                ((e.fromNodeId === parentSpouse && e.toNodeId === childNodeId) ||
                  (e.fromNodeId === childNodeId && e.toNodeId === parentSpouse))
            )

            if (!existingSpouseChildEdge) {
              const { error: spouseError } = await createTreeEdge({
                treeId: tree.id,
                fromNodeId: parentSpouse,
                toNodeId: childNodeId,
                type: edgeType,
              })

              if (spouseError) console.warn('Failed to create spouse-child relationship')
            }
          }

          setEdges((i) => addEdge(newEdge, i))
          toast.success(t_toasts('edge-created'))
        } else {
          const { error, message } = await createTreeEdge({
            treeId: tree.id,
            fromNodeId: conn.source,
            toNodeId: conn.target,
            type: edgeType,
          })

          if (error) {
            toast.error(t_errors(message || 'error'))
          } else {
            if (edgeType !== 'SPOUSE') setEdges((i) => addEdge(newEdge, i))
            toast.success(t_toasts('edge-created'))
          }
        }
      } catch (error) {
        toast.error(t_errors('error'))
      }
    },
    [setEdges, tree.id, t_errors, t_toasts, validateConnection, findSpouse]
  )

  /**
   * Delete an edge (relationship) by its id
   * @param edgeId - The id of the edge to delete
   * @param closeContextMenu - Function to close the context menu after deletion
   * @return {Promise<void>}
   */
  const deleteEdge = useCallback(
    async (edgeId: string, closeContextMenu: () => void) => {
      try {
        let edgeIdToDelete = edgeId

        const clickedEdge = treeEdges.find((e) => e.id === edgeId)

        if (
          clickedEdge &&
          (clickedEdge.source.startsWith('couple-') || clickedEdge.target.startsWith('couple-'))
        ) {
          let coupleNodeId: string
          let spouseNodeId: string | null = null
          let childNodeId: string | null = null

          if (clickedEdge.target.startsWith('couple-')) {
            coupleNodeId = clickedEdge.target
            spouseNodeId = clickedEdge.source
          } else {
            coupleNodeId = clickedEdge.source
            childNodeId = clickedEdge.target
          }

          const pairId = coupleNodeId.replace('couple-', '')
          const [spouse1, spouse2] = pairId.split('-')

          if (spouseNodeId) {
            const spouseEdge = edges.find(
              (e) =>
                e.type === 'SPOUSE' &&
                ((e.fromNodeId === spouse1 && e.toNodeId === spouse2) ||
                  (e.fromNodeId === spouse2 && e.toNodeId === spouse1))
            )

            if (spouseEdge) {
              try {
                const { error, message } = await deleteTreeEdge(spouseEdge.id, tree.id)
                if (error) {
                  toast.error(t_errors(message || 'error'))
                } else {
                  toast.success(t_toasts('edge-deleted'))
                }
                closeContextMenu()
                return
              } catch (error) {
                toast.error(t_errors('error'))
                closeContextMenu()
                return
              }
            }
          } else if (childNodeId) {
            const edgesToDelete = edges.filter(
              (e) =>
                (e.type === 'PARENT' || e.type === 'CHILD') &&
                e.toNodeId === childNodeId &&
                (e.fromNodeId === spouse1 || e.fromNodeId === spouse2)
            )

            if (edgesToDelete.length > 0) {
              try {
                for (const edgeToDelete of edgesToDelete) {
                  const { error } = await deleteTreeEdge(edgeToDelete.id, tree.id)
                  if (error) {
                    toast.error(t_errors('error'))
                    closeContextMenu()
                    return
                  }
                }
                toast.success(t_toasts('edge-deleted'))
                closeContextMenu()
                return
              } catch (error) {
                toast.error(t_errors('error'))
                closeContextMenu()
                return
              }
            }
          }

          toast.error(t_errors('error-edge-not-found'))
          closeContextMenu()
          return
        }

        const clickedEdgeInFlow = treeEdges.find((e) => e.id === edgeIdToDelete)

        if (!clickedEdgeInFlow) {
          toast.error(t_errors('error-edge-not-found'))
          closeContextMenu()
          return
        }

        let dbEdgeId = edgeIdToDelete

        if (edgeIdToDelete.startsWith('edge-')) {
          const sourceNodeId = clickedEdgeInFlow.source
          const targetNodeId = clickedEdgeInFlow.target

          const dbEdge = edges.find(
            (e) =>
              (e.fromNodeId === sourceNodeId && e.toNodeId === targetNodeId) ||
              (e.fromNodeId === targetNodeId && e.toNodeId === sourceNodeId)
          )

          if (!dbEdge) {
            toast.error(t_errors('error-edge-not-found'))
            closeContextMenu()
            return
          }

          dbEdgeId = dbEdge.id
        }

        const { error, message } = await deleteTreeEdge(dbEdgeId, tree.id)

        if (error) {
          toast.error(t_errors(message || 'error'))
        } else {
          toast.success(t_toasts('edge-deleted'))
        }
      } catch (error) {
        toast.error(t_errors('error'))
      }

      closeContextMenu()
    },
    [treeEdges, edges, tree.id, t_errors, t_toasts]
  )

  return { onConnect, deleteEdge }
}
