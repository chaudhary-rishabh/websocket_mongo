import type WebSocket from 'ws'
import type { AuthPayload } from '../shared/types/index.js'

export interface AuthenticatedSocket extends WebSocket {
  userId: string
  user: AuthPayload
  isAlive: boolean
}

export type ClientEvent =
  | { type: 'JOIN_CONVERSATION'; conversationId: string }
  | { type: 'LEAVE_CONVERSATION'; conversationId: string }
  | { type: 'SEND_MESSAGE'; conversationId: string; tempId: string; messageType: 'text' | 'image' | 'voice' | 'file'; content: string; mediaUrl?: string; replyTo?: string }
  | { type: 'TYPING_START'; conversationId: string }
  | { type: 'TYPING_STOP'; conversationId: string }
  | { type: 'MARK_READ'; conversationId: string }
  | { type: 'ADD_REACTION'; messageId: string; conversationId: string; emoji: string }
  | { type: 'PING' }

export type ServerEvent =
  | { type: 'CONNECTED'; userId: string }
  | { type: 'NEW_MESSAGE'; message: Record<string, unknown>; tempId?: string }
  | { type: 'MESSAGE_UPDATED'; message: Record<string, unknown> }
  | { type: 'MESSAGE_DELETED'; messageId: string; conversationId: string }
  | { type: 'TYPING'; conversationId: string; userId: string; username: string }
  | { type: 'STOP_TYPING'; conversationId: string; userId: string }
  | { type: 'MESSAGES_READ'; conversationId: string; userId: string; readAt: string }
  | { type: 'USER_ONLINE'; userId: string }
  | { type: 'USER_OFFLINE'; userId: string; lastSeen: string }
  | { type: 'REACTION_UPDATED'; message: Record<string, unknown> }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'PONG' }
  | { type: 'STORY_CREATED'; userId: string; storyCount: number }
  | { type: 'STORY_EXPIRED'; userId: string }
