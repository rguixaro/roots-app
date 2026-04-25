'use client'

import { Baby, Heart, Users } from 'lucide-react'

import { TypographyH5 } from '@/ui'

import { TreeNode, Union } from '@/types'

interface NodeRelationsProps {
  node: TreeNode | null
  nodes: TreeNode[]
  unions: Union[]
  isMobile: boolean
  t_trees: (key: string) => string
}

export function NodeRelations({ node, nodes, unions, isMobile, t_trees }: NodeRelationsProps) {
  if (!node) return null

  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  const parentUnion = node.childOfUnionId
    ? (unions.find((u) => u.id === node.childOfUnionId) ?? null)
    : null
  const parents: TreeNode[] = parentUnion
    ? [parentUnion.spouseAId, parentUnion.spouseBId]
        .filter((id): id is string => !!id)
        .map((id) => nodeById.get(id))
        .filter((n): n is TreeNode => !!n)
    : []

  const spouseUnions = unions.filter((u) => u.spouseAId === node.id || u.spouseBId === node.id)

  const partners = spouseUnions
    .map((u) => {
      const otherId = u.spouseAId === node.id ? u.spouseBId : u.spouseAId
      if (!otherId) return null
      const partner = nodeById.get(otherId)
      if (!partner) return null
      return { partner, union: u }
    })
    .filter((x): x is { partner: TreeNode; union: Union } => !!x)

  const childIds = new Set<string>()
  for (const u of spouseUnions) {
    for (const n of nodes) if (n.childOfUnionId === u.id) childIds.add(n.id)
  }
  const children: TreeNode[] = Array.from(childIds)
    .map((id) => nodeById.get(id))
    .filter((n): n is TreeNode => !!n)
    .sort((a, b) => {
      const da = a.birthDate ? new Date(a.birthDate).getTime() : Number.POSITIVE_INFINITY
      const db = b.birthDate ? new Date(b.birthDate).getTime() : Number.POSITIVE_INFINITY
      return da - db
    })

  if (parents.length === 0 && partners.length === 0 && children.length === 0) return null

  const formatYear = (d: Date | null): string => (d ? String(new Date(d).getFullYear()) : '')

  const chipClass =
    'bg-ocean-200 text-pale-ocean rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap'

  return (
    <div>
      {!isMobile && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <TypographyH5>{t_trees('node-relations')}</TypographyH5>
        </div>
      )}

      <div className="border-ocean-200/50 shadow-center-sm bg-pale-ocean mb-2 space-y-4 rounded-xl border-2 px-4 py-3 text-left">
        {parents.length > 0 && (
          <section>
            <div className="text-ocean-300 mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Users size={14} />
              <span>{t_trees('node-relations-parents')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {parents.map((p) => (
                <span key={p.id} className={chipClass}>
                  {p.fullName}
                </span>
              ))}
            </div>
          </section>
        )}

        {partners.length > 0 && (
          <section>
            <div className="text-ocean-300 mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Heart size={14} />
              <span>{t_trees('node-relations-partners')}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {partners.map(({ partner, union }) => {
                const m = formatYear(union.marriedAt)
                const d = formatYear(union.divorcedAt)
                const bits: string[] = []
                if (m) bits.push(`${t_trees('node-relations-married')} ${m}`)
                if (d) bits.push(`${t_trees('node-relations-divorced')} ${d}`)
                if (union.place) bits.push(union.place)
                return (
                  <li key={union.id} className="flex flex-wrap items-center gap-2">
                    <span className={chipClass}>{partner.fullName}</span>
                    {bits.length > 0 && (
                      <span className="text-ocean-300/80 text-xs">{bits.join(' · ')}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {children.length > 0 && (
          <section>
            <div className="text-pale--300 mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Baby size={14} />
              <span>{t_trees('node-relations-children')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <span key={c.id} className={chipClass}>
                  {c.fullName}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
