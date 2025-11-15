export const TreeNodeGender = ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'] as const
export type TreeNodeGender = (typeof TreeNodeGender)[number]

export const TreeEdgeType = ['PARENT', 'CHILD', 'SPOUSE', 'COUPLE'] as const
export type TreeEdgeType = (typeof TreeEdgeType)[number]

export interface TreeNode {
  id: string
  familyId: string

  fullName: string
  birthDate?: Date | null
  deathDate?: Date | null
  photoUrl?: string | null
  gender: TreeNodeGender
  createdAt: Date
  updatedAt: Date

  edgesFrom?: TreeEdge[]
  edgesTo?: TreeEdge[]
}

export interface TreeEdge {
  id: string
  familyId: string

  type: TreeEdgeType
  createdAt: Date

  fromNodeId: string
  toNodeId: string

  fromNode?: TreeNode
  toNode?: TreeNode
}
