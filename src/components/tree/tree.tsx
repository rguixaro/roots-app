'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Minimize2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { type z } from 'zod'
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Connection,
  ConnectionLineType,
  Position,
  Node,
  Edge,
} from 'reactflow'
import dagre from 'dagre'

import { CreateTreeNodeSchema } from '@/server/schemas'
import { createTreeNode, createTreeEdge } from '@/server/actions'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SearchableSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TypographyH4,
  TypographyH5,
} from '@/ui'
import { checkKeyDown, cn } from '@/utils'
import { Family, TreeEdge, TreeNode } from '@/types'

import { StyledNode, VoidNode } from './node'
import { StyledEdge } from './edge'

const nodeWidth = 160
const nodeHeight = 60

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

function computedLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
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

  spouseEdges.forEach((edge) => {
    const source = computedNodes.find((n) => n.id === edge.source)
    const target = computedNodes.find((n) => n.id === edge.target)
    if (source && target) {
      target.position = { x: source.position.x + nodeWidth + 40, y: source.position.y }
    }
  })

  const computedEdges: Edge[] = edges.map((edge) => {
    const isSpouse = edge.data?.type === 'SPOUSE' || edge.type === 'SPOUSE'
    return {
      ...edge,
      type: isSpouse ? 'straight' : 'smoothstep',
      animated: !isSpouse,
      sourceHandle: isSpouse ? 'right' : 'bottom',
      targetHandle: isSpouse ? 'left' : 'top',
      style: isSpouse ? { stroke: '#2e6b74' } : { stroke: '#2e6b74', strokeWidth: 1 },
    }
  })

  return { nodes: computedNodes, edges: computedEdges }
}

interface StyledTreeProps {
  family: Family
  nodes: TreeNode[]
  edges: TreeEdge[]
}

export default function StyledTree({ family, nodes, edges }: StyledTreeProps) {
  const t = useTranslations('TreePage')
  const t_toasts = useTranslations('toasts')

  const [loading, setLoading] = React.useState<boolean>(false)
  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean
    x: number
    y: number
    edgeId: string | null
  }>({ visible: false, x: 0, y: 0, edgeId: null })

  const reactFlowInstance = useReactFlow()
  const [showModal, setShowModal] = React.useState(false)

  const form = useForm<z.infer<typeof CreateTreeNodeSchema>>({
    resolver: zodResolver(CreateTreeNodeSchema),
    defaultValues: { familyId: family.id, fullName: '' },
  })

  /**
   * Handle async operations with loading state
   * @param fn
   */
  const withAsync = async <T,>(fn: () => Promise<T>) => {
    try {
      setLoading(true)
      await fn()
    } finally {
      setLoading(false)
    }
  }

  /**
   * onSubmit form handler
   * @param values {z.infer<typeof CreateTreeNodeSchema>}
   */
  const onSubmit = async (values: z.infer<typeof CreateTreeNodeSchema>) =>
    withAsync(async () => {
      const cleanedValues = {
        ...values,
        motherId: values.motherId || null,
        fatherId: values.fatherId || null,
      }

      const { error, message, node, edges } = await createTreeNode(cleanedValues)
      if (error) return toast.error(t_toasts(message || 'error'))

      toast.success(t_toasts('node-created'))
      setShowModal(false)
      form.reset()
    })

  const nodeTypes = useMemo(() => ({ [family.type]: StyledNode, COUPLE: VoidNode }), [family.type])

  const resetView = () => reactFlowInstance.fitView({ padding: 0.2 })

  const handleNodeClick = (label: string) => {}

  const createNode = () => setShowModal(true)
  const handleModalClose = () => setShowModal(false)

  // Helper function to find spouse/partner of a given node
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

  // Handle mother selection with auto-father detection
  const handleMotherChange = useCallback(
    (motherId: string) => {
      form.setValue('motherId', motherId)
      if (!motherId) return

      const spouseId = findSpouse(motherId)
      if (spouseId && !form.getValues('fatherId')) form.setValue('fatherId', spouseId)
    },
    [form, findSpouse]
  )

  // Handle father selection with auto-mother detection
  const handleFatherChange = useCallback(
    (fatherId: string) => {
      form.setValue('fatherId', fatherId)
      if (!fatherId) return

      const spouseId = findSpouse(fatherId)
      if (spouseId && !form.getValues('motherId')) form.setValue('motherId', spouseId)
    },
    [form, findSpouse]
  )

  const layout = useMemo(() => {
    const treeEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      type: edge.type === 'SPOUSE' ? 'straight' : 'smoothstep',
      animated: edge.type !== 'SPOUSE',
      data: { type: edge.type },
    }))

    const treeNodes: Node[] = nodes.map((node) => {
      const edgesFrom = edges.filter((e) => e.fromNodeId === node.id)
      const edgesTo = edges.filter((e) => e.toNodeId === node.id)
      return {
        id: node.id,
        type: family.type,
        data: { node: { ...node, edgesFrom, edgesTo }, onClick: handleNodeClick },
        position: { x: 0, y: 0 },
      }
    })

    const coupleNodes: Node[] = []
    const coupleEdges: Edge[] = []

    const spouseEdges = treeEdges.filter((e) => e.data?.type === 'SPOUSE')
    const handledCouples = new Set<string>()

    let edgeCounter = 0

    spouseEdges.forEach((edge) => {
      const pairId = [edge.source, edge.target].sort().join('-')
      if (handledCouples.has(pairId)) return
      handledCouples.add(pairId)

      const coupleNodeId = `couple-${pairId}`
      coupleNodes.push({
        id: coupleNodeId,
        type: 'COUPLE',
        data: {},
        position: { x: 0, y: 0 },
      })

      coupleEdges.push({
        id: `edge-${edge.source}-${coupleNodeId}-${edgeCounter++}`,
        source: edge.source,
        target: coupleNodeId,
        type: 'smoothstep',
        animated: false,
      })

      coupleEdges.push({
        id: `edge-${edge.target}-${coupleNodeId}-${edgeCounter++}`,
        source: edge.target,
        target: coupleNodeId,
        type: 'smoothstep',
        animated: false,
      })

      const children = edges
        .filter((e) => e.type !== 'SPOUSE' && [edge.source, edge.target].includes(e.fromNodeId))
        .map((e) => e.toNodeId)

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
      if (e.type === 'SPOUSE') return true

      const isChildOfCouple = coupleNodes.some((couple) => {
        const [p1, p2] = couple.id.replace('couple-', '').split('-')
        return [p1, p2].includes(e.source)
      })

      return !isChildOfCouple
    })
    return {
      nodes: [...treeNodes, ...coupleNodes],
      edges: [...edgesWithoutSharedChildren, ...coupleEdges],
    }
  }, [family.type, edges, nodes])

  const { nodes: computedNodes, edges: computedEdges } = useMemo(
    () => computedLayout(layout.nodes, layout.edges),
    [layout]
  )

  const [treeNodes, setNodes, onNodesChange] = useNodesState(computedNodes)
  const [treeEdges, setEdges, onEdgesChange] = useEdgesState(computedEdges)

  useEffect(() => {
    setNodes(computedNodes)
    setEdges(computedEdges)
  }, [computedNodes, computedEdges, setNodes, setEdges])

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return

      // Check if nodes are the same (prevent self-connections)
      if (connection.source === connection.target) {
        toast.error(t_toasts('error-cannot-connect-to-self'))
        return
      }

      // Check if relationship already exists in UI (bidirectional check)
      const existingEdge = treeEdges.find(edge => 
        (edge.source === connection.source && edge.target === connection.target) ||
        (edge.source === connection.target && edge.target === connection.source)
      )
      
      if (existingEdge) {
        toast.error(t_toasts('error-relationship-already-exists'))
        return
      }

      // Add edge to UI first for immediate feedback
      const newEdge = { ...connection, animated: true, type: 'smoothstep' }
      setEdges((eds) => addEdge(newEdge, eds))

      try {
        // Create edge in database
        const { error, message } = await createTreeEdge({
          familyId: family.id,
          fromNodeId: connection.source,
          toNodeId: connection.target,
          type: 'PARENT', // Default type, could be made configurable
        })

        if (error) {
          // Remove edge from UI if database creation failed
          setEdges((eds) =>
            eds.filter((e) => !(e.source === connection.source && e.target === connection.target))
          )
          toast.error(t_toasts(message || 'error'))
        } else {
          toast.success(t_toasts('edge-created'))
        }
      } catch (error) {
        // Remove edge from UI if creation failed
        setEdges((eds) =>
          eds.filter((e) => !(e.source === connection.source && e.target === connection.target))
        )
        toast.error(t_toasts('error'))
      }
    },
    [setEdges, family.id, t_toasts, treeEdges]
  )

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault()
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, edgeId: null })
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body

    if (showModal) {
      const originalHtmlOverflow = html.style.overflow
      const originalBodyOverflow = body.style.overflow

      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'

      return () => {
        html.style.overflow = originalHtmlOverflow
        body.style.overflow = originalBodyOverflow
      }
    }
  }, [showModal])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu()

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible, closeContextMenu])

  return (
    <div className="relative h-[90vh] w-full overflow-hidden bg-slate-100">
      <div
        className={cn(
          'bg-ocean-50 absolute left-1/2 z-10 flex -translate-x-1/2 gap-4 px-4 py-1',
          'border-ocean-400/15 items-center rounded-lg rounded-t-none border-4 border-t-0 shadow-lg'
        )}
      >
        <div
          onClick={createNode}
          className={cn(
            'hover:bg-ocean-100/50 bg-ocean-50 cursor-pointer rounded p-1',
            'transition-colors duration-300'
          )}
        >
          <Plus size={20} className="text-ocean-400" />
        </div>
        <div className="bg-ocean-100 h-5 w-0.5" />
        <div
          onClick={resetView}
          className={cn(
            'hover:bg-ocean-100/50 bg-ocean-50 cursor-pointer rounded p-1',
            'transition-colors duration-300'
          )}
        >
          <Minimize2 size={20} className="text-ocean-400" />
        </div>
      </div>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-300',
          showModal ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={handleModalClose}
      />
      <div
        className={cn(
          'text-ocean-400 fixed inset-x-0 bottom-0 z-50 h-full transition-transform duration-300 ease-out sm:top-0 sm:right-0',
          showModal
            ? 'translate-y-1/2 sm:translate-x-3/5 sm:translate-y-0'
            : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={(e) => checkKeyDown(e)}
            className="w-full sm:h-full sm:w-2/5"
          >
            <div className="bg-pale-ocean shadow-2l h-full overflow-y-auto sm:flex">
              <div className="flex justify-center pt-3 pb-2 sm:hidden">
                <div className="bg-ocean-100 h-1.5 w-12 rounded-full" />
              </div>
              <div className="hidden h-full items-center justify-center px-3 sm:flex">
                <div className="bg-ocean-100 h-12 w-1.5 rounded-full" />
              </div>
              <div className="w-full px-6 pt-2 pb-6">
                <div className="mb-6 flex items-center justify-between">
                  <TypographyH4 className="mt-5">{t('node-create')}</TypographyH4>
                  <button
                    onClick={handleModalClose}
                    className="hover:bg-ocean-200/15 rounded p-1 transition-colors duration-300"
                  >
                    <X size={24} className="text-ocean-200" />
                  </button>
                </div>
                <TypographyH5 className="text-start">{t('node-general-info')}</TypographyH5>
                <div className="border-ocean-200/50 mb-2 flex-col items-start rounded border-2 bg-white px-3 py-2 text-left shadow-lg">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t('node-fullname')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Input
                              {...field}
                              autoComplete="off"
                              className="w-full"
                              placeholder={t('node-fullname')}
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t('node-birth-date')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Input
                              {...field}
                              value={
                                field.value ? new Date(field.value).toISOString().split('T')[0] : ''
                              }
                              onChange={(e) =>
                                field.onChange(e.target.value ? new Date(e.target.value) : null)
                              }
                              type="date"
                              autoComplete="off"
                              placeholder={t('node-birth-date')}
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deathDate"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t('node-death-date')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Input
                              {...field}
                              value={
                                field.value ? new Date(field.value).toISOString().split('T')[0] : ''
                              }
                              onChange={(e) =>
                                field.onChange(e.target.value ? new Date(e.target.value) : null)
                              }
                              type="date"
                              autoComplete="off"
                              placeholder={t('node-death-date')}
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t('node-gender')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ''}
                              disabled={loading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={'-'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">{t('node-gender-male')}</SelectItem>
                                <SelectItem value="FEMALE">{t('node-gender-female')}</SelectItem>
                                <SelectItem value="OTHER">{t('node-gender-other')}</SelectItem>
                                <SelectItem value="UNSPECIFIED">
                                  {t('node-gender-unspecified')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <TypographyH5 className="mt-5 text-start">{t('node-ancestry-info')}</TypographyH5>
                <div className="border-ocean-200/50 mb-2 flex-col items-start rounded border-2 bg-white px-3 py-2 text-left shadow-lg">
                  <FormField
                    control={form.control}
                    name="motherId"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t('node-mother')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <SearchableSelect
                              options={computedNodes
                                .filter(
                                  (node) =>
                                    node.data?.node?.fullName &&
                                    node.id !== form.getValues('fatherId')
                                )
                                .map((node) => ({
                                  value: node.id,
                                  label: node.data.node.fullName,
                                }))}
                              value={field.value || ''}
                              onValueChange={handleMotherChange}
                              placeholder={'-'}
                              searchPlaceholder={t('node-search')}
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-ocean-200/15 mx-auto my-3 h-1 w-full rounded" />
                  <FormField
                    control={form.control}
                    name="fatherId"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormLabel>{t('node-father')}</FormLabel>
                        <FormControl>
                          <div className="py-2">
                            <SearchableSelect
                              options={computedNodes
                                .filter(
                                  (node) =>
                                    node.data?.node?.fullName &&
                                    node.id !== form.getValues('motherId')
                                )
                                .map((node) => ({
                                  value: node.id,
                                  label: node.data.node.fullName,
                                }))}
                              value={field.value || ''}
                              onValueChange={handleFatherChange}
                              placeholder={'-'}
                              searchPlaceholder={t('node-search')}
                              disabled={loading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleModalClose}
                    className="bg-ocean-100/50 hover:bg-ocean-100 flex-1 rounded-lg px-4 py-2 text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-ocean-300 hover:bg-ocean-400 flex-1 rounded-lg px-4 py-2 text-white transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
      {contextMenu.visible && (
        <div
          className="border-ocean-200/50 fixed z-50 min-w-48 rounded-lg border bg-white shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-2">
            <button
              className="hover:bg-ocean-50 text-ocean-600 w-full px-4 py-2 text-left text-sm transition-colors"
              onClick={() => {
                console.log('Edit relationship:', contextMenu.edgeId)
                closeContextMenu()
              }}
            >
              Edit Relationship
            </button>
            <button
              className="hover:bg-ocean-50 text-ocean-600 w-full px-4 py-2 text-left text-sm transition-colors"
              onClick={() => {
                console.log('Change relationship type:', contextMenu.edgeId)
                closeContextMenu()
              }}
            >
              Change Type
            </button>
            <div className="border-ocean-100 my-1 border-t" />
            <button
              className="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              onClick={() => {
                console.log('Delete relationship:', contextMenu.edgeId)
                closeContextMenu()
              }}
            >
              Delete Relationship
            </button>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={treeNodes}
        edges={treeEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineComponent={StyledEdge}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#2e6b74', strokeWidth: 1 },
        }}
        panOnDrag
        zoomOnScroll
        deleteKeyCode={null}
        nodesDraggable={true}
        snapGrid={[15, 15]}
        style={{ background: '#f7fdfe', width: '100%', height: '100%' }}
        className="shadow-inner"
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Controls />
        <Background gap={24} size={1} color="#2e6b74" />
      </ReactFlow>
    </div>
  )
}
