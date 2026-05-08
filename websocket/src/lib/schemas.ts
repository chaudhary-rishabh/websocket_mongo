import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  initials: z.string().max(2),
  isOnline: z.boolean(),
  lastSeen: z.string(),
  role: z.enum(['admin', 'member']).optional(),
})

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  type: z.enum(['text', 'image', 'voice']),
  content: z.string(),
  timestamp: z.string(),
  reactions: z
    .array(z.object({ emoji: z.string(), count: z.number() }))
    .optional(),
  viewCount: z.number(),
  isRead: z.boolean(),
  isPending: z.boolean().optional(),
})

export const ConversationSchema = z.object({
  id: z.string(),
  type: z.enum(['direct', 'group']),
  name: z.string(),
  avatar: z.string().optional(),
  initials: z.string().optional(),
  members: z.array(z.string()),
  onlineCount: z.number().optional(),
  lastMessage: z.string(),
  lastMessageTime: z.string(),
  unreadCount: z.number(),
  isPinned: z.boolean(),
  lastMessageSentByMe: z.boolean(),
})

export const MessageInputSchema = z.object({
  content: z.string().min(1).max(2000),
})

export type User = z.infer<typeof UserSchema>
export type Message = z.infer<typeof MessageSchema>
export type Conversation = z.infer<typeof ConversationSchema>
export type MessageInput = z.infer<typeof MessageInputSchema>
