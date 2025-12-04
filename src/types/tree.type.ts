import { User } from './user.type'
import { PictureTag } from './picture.type'

export const TreeType = ['HUMAN', 'ANIMAL'] as const
export type TreeType = (typeof TreeType)[number]

export const TreeAccessRole = ['VIEWER', 'EDITOR', 'ADMIN'] as const
export type TreeAccessRole = (typeof TreeAccessRole)[number]

export interface Tree {
  id: string
  slug: string
  name: string
  type: TreeType
  nodeImage: boolean
  nodeGallery: boolean
  createdAt: Date
  updatedAt: Date

  nodes?: TreeNode[]
  edges?: TreeEdge[]
  accesses?: TreeAccess[]
}

export interface TreeAccess {
  id: string
  treeId: string
  userId: string
  user: User
  role: TreeAccessRole
  createdAt: Date
}

export const TreeNodeGender = ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'] as const
export type TreeNodeGender = (typeof TreeNodeGender)[number]

export const TreeEdgeType = ['PARENT', 'CHILD', 'SPOUSE', 'COUPLE'] as const
export type TreeEdgeType = (typeof TreeEdgeType)[number]

export interface TreeNode {
  id: string
  treeId: string

  fullName: string
  birthDate?: Date | null
  deathDate?: Date | null
  gender: TreeNodeGender
  birthPlace?: string | null
  biography?: string | null
  createdAt: Date
  updatedAt: Date

  taggedIn?: PictureTag[]

  edgesFrom?: TreeEdge[]
  edgesTo?: TreeEdge[]
}

export interface TreeEdge {
  id: string
  treeId: string

  type: TreeEdgeType
  createdAt: Date

  fromNodeId: string
  toNodeId: string

  fromNode?: TreeNode
  toNode?: TreeNode
}
