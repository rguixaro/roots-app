import z from 'zod'

export const FamilyType = ['HUMAN', 'ANIMAL'] as const
export type FamilyType = (typeof FamilyType)[number]

export const FamilyRole = ['VIEWER', 'EDITOR', 'ADMIN'] as const
export type FamilyRole = (typeof FamilyRole)[number]

export const TreeNodeGender = ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'] as const
export type TreeNodeGender = (typeof TreeNodeGender)[number]

export const TreeEdgeType = ['PARENT', 'CHILD', 'SPOUSE', 'COUPLE'] as const
export type TreeEdgeType = (typeof TreeEdgeType)[number]

// Schema for creating a new family
export const CreateFamilySchema = z.object({
  name: z.string().min(3, { message: 'family-name-too-short' }),
  type: z.enum(FamilyType, { required_error: 'family-type-required' }),
  nodeImage: z.boolean({ required_error: 'family-option-required' }),
  nodeGallery: z.boolean({ required_error: 'family-option-required' }),
  members: z
    .array(
      z.object({
        userId: z.string(),
        name: z.string().nullable(),
        email: z.string().email().nullable(),
        role: z.enum(FamilyRole),
      })
    )
    .optional(),
})
export type CreateFamilyInput = z.TypeOf<typeof CreateFamilySchema>

// Schema for a Family record
export const FamilySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.enum(FamilyType),
  nodeImage: z.boolean().default(false),
  nodeGallery: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type FamilySchema = z.TypeOf<typeof FamilySchema>

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
})
export type UserSchema = z.TypeOf<typeof UserSchema>

// Schema for FamilyAccess record
export const FamilyAccessSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  userId: z.string(),
  user: UserSchema,
  role: z.enum(FamilyRole).default('VIEWER'),
  createdAt: z.date(),
})

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'username-required' })
    .max(40, { message: 'username-too-long' }),
  email: z.string().email({ message: 'email-invalid' }),
  isPrivate: z.boolean().optional(),
})

export type UpdateProfileInput = z.TypeOf<typeof UpdateProfileSchema>

export const CreateTreeNodeSchema = z.object({
  familyId: z.string().min(1, { message: 'family-id-required' }),
  fullName: z.string().min(1, { message: 'full-name-required' }),
  birthDate: z.coerce.date().optional().nullable(),
  deathDate: z.coerce.date().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  gender: z.enum(TreeNodeGender, { required_error: 'gender-required' }),
  motherId: z.string().optional().nullable(),
  fatherId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  edgesFrom: z.array(z.any()).optional().nullable(),
  edgesTo: z.array(z.any()).optional().nullable(),
})

export type CreateTreeMemberInput = z.TypeOf<typeof CreateTreeNodeSchema>

export const UpdateTreeNodeSchema = z.object({
  id: z.string(),
  familyId: z.string().min(1, { message: 'family-id-required' }),
  fullName: z.string().min(1, { message: 'full-name-required' }),
  birthDate: z.coerce.date().optional().nullable(),
  deathDate: z.coerce.date().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  gender: z.enum(TreeNodeGender, { required_error: 'gender-required' }),
})

export type UpdateTreeNodeInput = z.TypeOf<typeof UpdateTreeNodeSchema>

export const CreateTreeEdgeSchema = z.object({
  familyId: z.string().min(1, { message: 'family-id-required' }),
  fromNodeId: z.string().min(1, { message: 'from-node-required' }),
  toNodeId: z.string().min(1, { message: 'to-node-required' }),
  type: z.enum(TreeEdgeType, { required_error: 'edge-type-required' }),
})

export type CreateTreeEdgeInput = z.TypeOf<typeof CreateTreeEdgeSchema>
