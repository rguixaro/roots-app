import { StyledNode, VoidNode } from '@/components/tree/nodes'
import { ChildEdge, CoupleBusEdge, SpouseEdge } from '@/components/tree/edges'

// React Flow requires stable nodeTypes/edgeTypes refs across renders.
// Module-level frozen objects guarantee a single reference for the app lifetime.
export const REACT_FLOW_NODE_TYPES = Object.freeze({
  DEFAULT: StyledNode,
  COUPLE: VoidNode,
})

export const REACT_FLOW_EDGE_TYPES = Object.freeze({
  COUPLE_BUS: CoupleBusEdge,
  SPOUSE: SpouseEdge,
  CHILD: ChildEdge,
})

// React Flow's default `onError` fires warning #002 during render before the
// `onError` prop on `<ReactFlow>` has been stored, so it can't suppress it.
// Patch console.warn once to swallow just that message; HMR re-runs trigger
// the false positive even though our types are stable.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  type Patched = Console & { __reactFlow002Patched?: boolean }
  const c = console as Patched
  if (!c.__reactFlow002Patched) {
    const original = console.warn.bind(console)
    console.warn = (...args: unknown[]) => {
      const first = args[0]
      if (
        typeof first === 'string' &&
        first.includes('[React Flow]:') &&
        first.includes('nodeTypes or edgeTypes')
      ) {
        return
      }
      original(...args)
    }
    c.__reactFlow002Patched = true
  }
}
