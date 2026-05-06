import { z } from 'zod'

export const CreateConversationSchema = z
  .object({
    type: z.enum(['dm', 'group']),
    members: z.array(z.string().min(1)).min(1).max(100),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .refine((d) => d.type !== 'group' || !!d.name, {
    message: 'Group conversations require a name',
    path: ['name'],
  })

export const UpdateConversationSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  avatar: z.string().url().optional(),
})

export const ConversationIdParamSchema = z.object({
  conversationId: z.string().min(1),
})

export const AddMembersSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
})

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
export type UpdateConversationInput = z.infer<typeof UpdateConversationSchema>
export type AddMembersInput = z.infer<typeof AddMembersSchema>
