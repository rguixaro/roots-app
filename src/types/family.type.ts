import { TreeEdge, TreeNode } from './tree.type'
import { User } from './user.type'

export const FamilyType = ['HUMAN', 'ANIMAL'] as const
export type FamilyType = (typeof FamilyType)[number]

export const FamilyRole = ['VIEWER', 'EDITOR', 'ADMIN'] as const
export type FamilyRole = (typeof FamilyRole)[number]

export interface Family {
  id: string
  slug: string
  name: string
  type: FamilyType
  nodeImage: boolean
  nodeGallery: boolean
  createdAt: Date
  updatedAt: Date

  nodes?: TreeNode[]
  edges?: TreeEdge[]
  accesses?: FamilyAccess[]
}

export interface FamilyAccess {
  id: string
  familyId: string
  userId: string
  user: User
  role: FamilyRole
  createdAt: Date
}
