import { z } from 'zod'

export const CreateStorySchema = z.object({
  caption: z.string().trim().max(200).optional(),
})

export const StoryIdParamSchema = z.object({
  storyId: z.string().min(1),
})

export const UserIdParamSchema = z.object({
  userId: z.string().min(1),
})

export type CreateStoryInput = z.infer<typeof CreateStorySchema>
export type StoryIdParam = z.infer<typeof StoryIdParamSchema>
export type UserIdParam = z.infer<typeof UserIdParamSchema>
