import { User } from './user.type'

export const FamilyTypes = ['HUMAN', 'ANIMAL'] as const
export type FamilyTypes = (typeof FamilyTypes)[number]

export const FamilyRoles = ['VIEWER', 'EDITOR', 'ADMIN'] as const
export type FamilyRoles = (typeof FamilyRoles)[number]

export interface Family {
  id: string
  slug: string
  name: string
  type: FamilyTypes
  nodeImage: boolean
  nodeGallery: boolean
  createdAt: Date
  updatedAt: Date
  accesses?: FamilyAccess[]
}

export interface FamilyAccess {
  id: string
  familyId: string
  userId: string
  user: User
  role: FamilyRoles
  createdAt: Date
}
