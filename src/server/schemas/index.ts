import z from 'zod'

export const TreeType = ['HUMAN', 'ANIMAL'] as const
export type TreeType = (typeof TreeType)[number]

export const TreeAccessRole = ['VIEWER', 'EDITOR', 'ADMIN'] as const
export type TreeAccessRole = (typeof TreeAccessRole)[number]

export const TreeNodeGender = ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'] as const
export type TreeNodeGender = (typeof TreeNodeGender)[number]

export const TreeEdgeType = ['PARENT', 'CHILD', 'SPOUSE', 'COUPLE'] as const
export type TreeEdgeType = (typeof TreeEdgeType)[number]

export const ActivityAction = [
  'NODE_CREATED',
  'NODE_UPDATED',
  'NODE_DELETED',

  'EDGE_CREATED',
  'EDGE_DELETED',

  'PICTURE_ADDED',
  'PICTURE_DELETED',

  'PICTURE_TAG_CREATED',
  'PICTURE_TAG_DELETED',

  'TREE_UPDATED',
] as const
export type ActivityAction = (typeof ActivityAction)[number]

// Schema for creating a new tree
export const CreateTreeSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'tree-name-too-short' })
    .max(24, { message: 'tree-name-too-long' }),
  type: z.enum(TreeType, { required_error: 'tree-type-required' }),
  nodeImage: z.boolean({ required_error: 'tree-option-required' }),
  nodeGallery: z.boolean({ required_error: 'tree-option-required' }),
  members: z
    .array(
      z.object({
        userId: z.string(),
        name: z.string().nullable(),
        email: z.string().email().nullable(),
        role: z.enum(TreeAccessRole),
      })
    )
    .optional(),
})
export type CreateTreeInput = z.TypeOf<typeof CreateTreeSchema>

// Schema for a Tree record
export const TreeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.enum(TreeType),
  nodeImage: z.boolean().default(false),
  nodeGallery: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type TreeSchema = z.TypeOf<typeof TreeSchema>

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
})
export type UserSchema = z.TypeOf<typeof UserSchema>

// Schema for TreeAccess record
export const TreeAccessSchema = z.object({
  id: z.string(),
  treeId: z.string(),
  userId: z.string(),
  user: UserSchema,
  role: z.enum(TreeAccessRole).default('VIEWER'),
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
  treeId: z.string().min(1),
  fullName: z.string().min(1, { message: 'full-name-required' }),
  alias: z.string().max(16, { message: 'alias-too-long' }).optional().nullable(),
  birthPlace: z.string().nullable().optional(),
  birthDate: z.coerce.date().optional().nullable(),
  deathDate: z.coerce.date().optional().nullable(),
  gender: z.enum(TreeNodeGender, { required_error: 'gender-required' }),
  biography: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  edgesFrom: z.array(z.any()).optional().nullable(),
  edgesTo: z.array(z.any()).optional().nullable(),
})

export type CreateTreeMemberInput = z.TypeOf<typeof CreateTreeNodeSchema>

export const UpdateTreeNodeSchema = z.object({
  id: z.string(),
  treeId: z.string().min(1),
  fullName: z.string().min(1, { message: 'full-name-required' }),
  alias: z.string().max(16, { message: 'alias-too-long' }).optional().nullable(),
  birthPlace: z.string().nullable().optional(),
  birthDate: z.coerce.date().optional().nullable(),
  deathDate: z.coerce.date().optional().nullable(),
  gender: z.enum(TreeNodeGender, { required_error: 'gender-required' }),
  biography: z.string().nullable().optional(),
})

export type UpdateTreeNodeInput = z.TypeOf<typeof UpdateTreeNodeSchema>

export const CreateTreeEdgeSchema = z.object({
  treeId: z.string().min(1),
  fromNodeId: z.string().min(1, { message: 'from-node-required' }),
  toNodeId: z.string().min(1, { message: 'to-node-required' }),
  type: z.enum(TreeEdgeType, { required_error: 'edge-type-required' }),
})

export type CreateTreeEdgeInput = z.TypeOf<typeof CreateTreeEdgeSchema>
