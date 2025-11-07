import z from 'zod'

export const FamilyTypes = ['Animal', 'Human'] as const

export type FamilyTypes = (typeof FamilyTypes)[number]

export const FamilySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  type: z.enum(FamilyTypes),
  nodeImage: z.boolean().default(false),
  nodeGallery: z.boolean().default(false),
  authorId: z.string(),
  createdAt: z.date(),
})

export const AuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const CreateFamilySchema = z.object({
  name: z.string().min(3, { message: 'family-name-too-short' }),
  type: z.enum(FamilyTypes, {
    required_error: 'family-type-required',
  }),
  nodeImage: z.boolean().default(false).optional(),
  nodeGallery: z.boolean().default(false).optional(),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, { message: 'username-required' }).max(40, {
    message: 'username-too-long',
  }),
  email: z.string().email({ message: 'email-invalid' }),
  isPrivate: z.boolean().optional(),
})

export type UpdateProfileInput = z.TypeOf<typeof UpdateProfileSchema>

export type FamilySchema = z.TypeOf<typeof FamilySchema>
export type AuthorSchema = z.TypeOf<typeof AuthorSchema>
export type CreateFamilyInput = z.TypeOf<typeof CreateFamilySchema>
