import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(300).optional(),
})

export const UserIdParamSchema = z.object({
  userId: z.string().min(1),
})

export const SearchUsersQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type SearchUsersQuery = z.infer<typeof SearchUsersQuerySchema>
