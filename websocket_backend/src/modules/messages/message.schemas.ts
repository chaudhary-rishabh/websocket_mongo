import { z } from 'zod'

export const SendMessageSchema = z.object({
  type: z.enum(['text', 'image', 'voice', 'file']),
  content: z.string().trim().min(1).max(10_000),
  mediaUrl: z.string().url().optional(),
  replyTo: z.string().optional(),
})

export const EditMessageSchema = z.object({
  content: z.string().trim().min(1).max(10_000),
})

export const ReactSchema = z.object({
  emoji: z.string().min(1).max(8),
})

export const MessageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
})

export const MessageIdParamSchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
})

export const ConvParamSchema = z.object({
  conversationId: z.string().min(1),
})

export type SendMessageInput = z.infer<typeof SendMessageSchema>
export type EditMessageInput = z.infer<typeof EditMessageSchema>
export type ReactInput = z.infer<typeof ReactSchema>
export type MessageQuery = z.infer<typeof MessageQuerySchema>
