// ─── API shapes (match backend MongoDB field names exactly) ─────────────────

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

export interface ApiMessageSender {
  _id: string
  username: string
  displayName: string
  avatar?: string
}

export interface ApiMessage {
  _id: string
  conversationId: string
  /** Populated user object from API/WS; raw string ID for optimistic messages */
  senderId: ApiMessageSender | string
  type: 'text' | 'image' | 'voice' | 'file'
  content: string
  mediaUrl?: string
  replyTo?: string
  reactions: { userId: string; emoji: string }[]
  readBy: { userId: string; readAt: string }[]
  createdAt: string
  updatedAt: string
  /** Present only before server confirms (optimistic UI) */
  tempId?: string
  isPending?: boolean
}

export interface ApiConversation {
  _id: string
  type: 'dm' | 'group'
  name?: string
  avatar?: string
  members: ApiUser[]
  admins?: string[]
  lastMessage?: ApiMessage
  lastMessageTime?: string
  unreadCount?: number
  isPinned?: boolean
  createdAt: string
}

export interface PopulatedMember {
  id: string
  name: string
  avatar?: string
  initials: string
  isOnline: boolean
  isAdmin: boolean
  isMe: boolean
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
