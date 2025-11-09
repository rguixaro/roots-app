import z from 'zod'

export const FamilyTypes = ['HUMAN', 'ANIMAL'] as const
export type FamilyTypes = (typeof FamilyTypes)[number]

export const FamilyRoles = ['VIEWER', 'EDITOR', 'ADMIN'] as const
export type FamilyRoles = (typeof FamilyRoles)[number]

// Schema for creating a new family
export const CreateFamilySchema = z.object({
  name: z.string().min(3, { message: 'family-name-too-short' }),
  type: z.enum(FamilyTypes, { required_error: 'family-type-required' }),
  nodeImage: z.boolean({ required_error: 'family-option-required' }),
  nodeGallery: z.boolean({ required_error: 'family-option-required' }),
  members: z
    .array(
      z.object({
        userId: z.string(),
        name: z.string().nullable(),
        email: z.string().email().nullable(),
        role: z.enum(FamilyRoles),
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
  type: z.enum(FamilyTypes),
  nodeImage: z.boolean().default(false),
  nodeGallery: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type FamilySchema = z.TypeOf<typeof FamilySchema>

// Schema for FamilyAccess record
export const FamilyAccessSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  userId: z.string(),
  role: z.enum(FamilyRoles).default('VIEWER'),
  createdAt: z.date(),
})

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
})
export type UserSchema = z.TypeOf<typeof UserSchema>

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'username-required' })
    .max(40, { message: 'username-too-long' }),
  email: z.string().email({ message: 'email-invalid' }),
  isPrivate: z.boolean().optional(),
})

export type UpdateProfileInput = z.TypeOf<typeof UpdateProfileSchema>
