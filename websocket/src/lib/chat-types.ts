// ─── API shapes (from backend MongoDB) ──────────────────────────────────────

export interface ApiUser {
  _id: string
  username: string
  displayName: string
  email: string
  avatar?: string
  bio?: string
  role: string
  isOnline: boolean
  lastSeen?: string
}

export interface ApiMessage {
  _id: string
  conversationId: string
  sender: ApiUser | string
  type: 'text' | 'image' | 'voice' | 'file'
  content: string
  mediaUrl?: string
  replyTo?: string
  reactions: { userId: string; emoji: string }[]
  readBy: string[]
  createdAt: string
  updatedAt: string
  /** Optimistic UI — present only before server confirms */
  tempId?: string
  isPending?: boolean
}

export interface ApiConversation {
  _id: string
  type: 'direct' | 'group'
  name?: string
  avatar?: string
  participants: ApiUser[]
  lastMessage?: ApiMessage
  lastMessageTime?: string
  unreadCount?: number
  isPinned?: boolean
  createdAt: string
}

// ─── WebSocket events ────────────────────────────────────────────────────────

export type ServerEvent =
  | { type: 'CONNECTED'; userId: string }
  | { type: 'NEW_MESSAGE'; message: ApiMessage; tempId?: string }
  | { type: 'TYPING'; conversationId: string; userId: string; username: string }
  | { type: 'STOP_TYPING'; conversationId: string; userId: string }
  | { type: 'MESSAGES_READ'; conversationId: string; userId: string; readAt: string }
  | { type: 'USER_ONLINE'; userId: string }
  | { type: 'USER_OFFLINE'; userId: string; lastSeen: string }
  | { type: 'REACTION_UPDATED'; message: ApiMessage }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'PONG' }

export type ClientEvent =
  | { type: 'JOIN_CONVERSATION'; conversationId: string }
  | { type: 'LEAVE_CONVERSATION'; conversationId: string }
  | { type: 'SEND_MESSAGE'; conversationId: string; tempId: string; messageType: 'text' | 'image' | 'voice' | 'file'; content: string; mediaUrl?: string; replyTo?: string }
  | { type: 'TYPING_START'; conversationId: string }
  | { type: 'TYPING_STOP'; conversationId: string }
  | { type: 'MARK_READ'; conversationId: string }
  | { type: 'PING' }
