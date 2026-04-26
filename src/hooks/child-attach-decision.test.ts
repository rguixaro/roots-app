import { describe, it, expect } from 'vitest'

import type { TreeEdge, TreeNode, Union } from '@/types'

import { decideChildAttachment } from './child-attach-decision'

const person = (id: string, extra: Partial<TreeNode> = {}): TreeNode => ({
  id,
  treeId: 't1',
  fullName: id,
  gender: 'UNSPECIFIED',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...extra,
})

const union = (id: string, spouseAId: string, spouseBId: string | null): Union => ({
  id,
  treeId: 't1',
  spouseAId,
  spouseBId,
  marriedAt: null,
  divorcedAt: null,
  place: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
})

const parentEdge = (id: string, parentId: string, childId: string): TreeEdge => ({
  id,
  treeId: 't1',
  type: 'PARENT',
  createdAt: new Date(0),
  fromNodeId: parentId,
  toNodeId: childId,
})

describe('decideChildAttachment', () => {
  it('noops when the child already has childOfUnionId set', () => {
    const nodes = [person('P'), person('C', { childOfUnionId: 'u1' })]
    const unions = [union('u1', 'P', null)]
    const decision = decideChildAttachment('P', 'C', nodes, unions, [])
    expect(decision.kind).toBe('noop')
  })

  it('noops when the child node is not present (defensive)', () => {
    const decision = decideChildAttachment('P', 'missing', [person('P')], [], [])
    expect(decision.kind).toBe('noop')
  })

  it('signals create-single-parent-union when the parent has 0 unions', () => {
    const nodes = [person('P'), person('C')]
    const decision = decideChildAttachment('P', 'C', nodes, [], [])
    expect(decision).toEqual({ kind: 'create-single-parent-union' })
  })

  it('attaches directly when the parent has exactly one union (monogamous)', () => {
    const nodes = [person('P'), person('Q'), person('C')]
    const unions = [union('u1', 'P', 'Q')]
    const decision = decideChildAttachment('P', 'C', nodes, unions, [])
    expect(decision).toEqual({ kind: 'attach-to-existing-union', unionId: 'u1' })
  })

  it('attaches directly for a single-parent union (no spouseB)', () => {
    const nodes = [person('P'), person('C')]
    const unions = [union('u1', 'P', null)]
    const decision = decideChildAttachment('P', 'C', nodes, unions, [])
    expect(decision).toEqual({ kind: 'attach-to-existing-union', unionId: 'u1' })
  })

  it('auto-picks the compatible union in a multi-marriage when one other spouse is already a parent', () => {
    const nodes = [person('Alice'), person('Bob'), person('Charlie'), person('Child')]
    const unions = [union('u1', 'Alice', 'Bob'), union('u2', 'Alice', 'Charlie')]
    const edges = [parentEdge('e1', 'Bob', 'Child')]
    const decision = decideChildAttachment('Alice', 'Child', nodes, unions, edges)
    expect(decision).toEqual({ kind: 'attach-to-existing-union', unionId: 'u1' })
  })

  it('prompts with all unions when multiple are compatible', () => {
    const nodes = [person('Alice'), person('Bob'), person('Charlie'), person('Child')]
    const unions = [union('u1', 'Alice', 'Bob'), union('u2', 'Alice', 'Charlie')]
    const edges = [parentEdge('e1', 'Bob', 'Child'), parentEdge('e2', 'Charlie', 'Child')]
    const decision = decideChildAttachment('Alice', 'Child', nodes, unions, edges)
    expect(decision.kind).toBe('prompt')
    if (decision.kind === 'prompt') {
      expect(decision.candidates.map((u) => u.id).sort()).toEqual(['u1', 'u2'])
    }
  })

  it('prompts with all unions when multi-marriage has no clearly compatible union', () => {
    const nodes = [person('Alice'), person('Bob'), person('Charlie'), person('Child')]
    const unions = [union('u1', 'Alice', 'Bob'), union('u2', 'Alice', 'Charlie')]
    const decision = decideChildAttachment('Alice', 'Child', nodes, unions, [])
    expect(decision.kind).toBe('prompt')
    if (decision.kind === 'prompt') {
      expect(decision.candidates.map((u) => u.id).sort()).toEqual(['u1', 'u2'])
    }
  })

  it('includes a single-parent union in the compatible set even when mixed with 2-spouse unions', () => {
    const nodes = [person('Alice'), person('Bob'), person('Child')]
    const unions = [union('u1', 'Alice', null), union('u2', 'Alice', 'Bob')]
    const decision = decideChildAttachment('Alice', 'Child', nodes, unions, [])
    expect(decision).toEqual({ kind: 'attach-to-existing-union', unionId: 'u1' })
  })

  it('recognizes a CHILD-typed edge the same as a PARENT-typed edge for compatibility', () => {
    const nodes = [person('Alice'), person('Bob'), person('Charlie'), person('Child')]
    const unions = [union('u1', 'Alice', 'Bob'), union('u2', 'Alice', 'Charlie')]
    const edges: TreeEdge[] = [
      {
        id: 'e1',
        treeId: 't1',
        type: 'CHILD',
        createdAt: new Date(0),
        fromNodeId: 'Child',
        toNodeId: 'Bob',
      },
    ]
    const decision = decideChildAttachment('Alice', 'Child', nodes, unions, edges)
    expect(decision).toEqual({ kind: 'attach-to-existing-union', unionId: 'u1' })
  })
})
