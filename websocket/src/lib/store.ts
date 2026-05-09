import { create } from 'zustand'
import type { ApiMessage, ApiMessageSender, ApiConversation } from './chat-types'

interface ChatStore {
  activeConversationId: string | null
  setActiveConversationId: (id: string) => void

  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void

  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  wsConnected: boolean
  setWsConnected: (v: boolean) => void

  realtimeMessages: Record<string, ApiMessage[]>
  appendMessage: (convId: string, msg: ApiMessage) => void
  replaceTempMessage: (convId: string, tempId: string, msg: ApiMessage) => void
  prependMessages: (convId: string, msgs: ApiMessage[]) => void
  markMessagesRead: (convId: string, userId: string, readAt: string) => void
  updateMessage: (convId: string, msg: ApiMessage) => void

  typingUsers: Record<string, Record<string, string>>
  setTyping: (convId: string, userId: string, username: string, isTyping: boolean) => void

  onlineUserIds: Set<string>
  setUserOnline: (userId: string) => void
  setUserOffline: (userId: string) => void

  realConversations: ApiConversation[]
  setRealConversations: (convs: ApiConversation[]) => void
  clearUnreadCount: (convId: string) => void
  updateConversationLastMessage: (convId: string, msg: ApiMessage) => void

  messagePagination: Record<string, { nextCursor?: string; hasMore: boolean }>
  setMessagePagination: (convId: string, info: { nextCursor?: string; hasMore: boolean }) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConversationId: 'conv-1',
  setActiveConversationId: (id) => set({ activeConversationId: id, isSidebarOpen: false }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  realtimeMessages: {},
  appendMessage: (convId, msg) =>
    set((s) => {
      const prev = s.realtimeMessages[convId] ?? []
      if (prev.some((m) => m._id === msg._id)) return s
      return { realtimeMessages: { ...s.realtimeMessages, [convId]: [...prev, msg] } }
    }),
  replaceTempMessage: (convId, tempId, msg) =>
    set((s) => {
      const prev = s.realtimeMessages[convId] ?? []
      const idx = prev.findIndex((m) => m.tempId === tempId)
      if (idx === -1) {
        if (prev.some((m) => m._id === msg._id)) return s
        return { realtimeMessages: { ...s.realtimeMessages, [convId]: [...prev, msg] } }
      }
      const next = [...prev]
      next[idx] = msg
      return { realtimeMessages: { ...s.realtimeMessages, [convId]: next } }
    }),
  prependMessages: (convId, msgs) =>
    set((s) => {
      const prev = s.realtimeMessages[convId] ?? []
      const existingIds = new Set(prev.map((m) => m._id))
      const newMsgs = msgs.filter((m) => !existingIds.has(m._id))
      return { realtimeMessages: { ...s.realtimeMessages, [convId]: [...newMsgs, ...prev] } }
    }),
  markMessagesRead: (convId, userId, readAt) =>
    set((s) => {
      const msgs = s.realtimeMessages[convId]
      if (!msgs) return s
      const updated = msgs.map((m) => {
        const senderId = typeof m.senderId === 'object'
          ? (m.senderId as ApiMessageSender)._id
          : m.senderId
        if (senderId === userId) return m
        if (m.readBy.some((r) => r.userId === userId)) return m
        return { ...m, readBy: [...m.readBy, { userId, readAt }] }
      })
      return { realtimeMessages: { ...s.realtimeMessages, [convId]: updated } }
    }),
  updateMessage: (convId, msg) =>
    set((s) => {
      const msgs = s.realtimeMessages[convId]
      if (!msgs) return s
      const updated = msgs.map((m) => (m._id === msg._id ? msg : m))
      return { realtimeMessages: { ...s.realtimeMessages, [convId]: updated } }
    }),  

  typingUsers: {},
  setTyping: (convId, userId, username, isTyping) =>
    set((s) => {
      const prev = { ...(s.typingUsers[convId] ?? {}) }
      if (isTyping) prev[userId] = username
      else delete prev[userId]
      return { typingUsers: { ...s.typingUsers, [convId]: prev } }
    }),  

  onlineUserIds: new Set(),
  setUserOnline: (userId) =>
    set((s) => ({ onlineUserIds: new Set([...s.onlineUserIds, userId]) })),
  setUserOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds)
      next.delete(userId)
      return { onlineUserIds: next }
    }),  

  realConversations: [],
  setRealConversations: (convs) => set({ realConversations: convs }),
  clearUnreadCount: (convId) =>
    set((s) => ({
      realConversations: s.realConversations.map((c) =>
        c._id === convId ? { ...c, unreadCount: 0 } : c,
      ),
    })),
  updateConversationLastMessage: (convId, msg) =>
    set((s) => {
      const idx = s.realConversations.findIndex((c) => c._id === convId)
      if (idx === -1) return s
      const updated = { ...s.realConversations[idx], lastMessage: msg, lastMessageTime: msg.createdAt }
      const rest = s.realConversations.filter((_, i) => i !== idx)
      return { realConversations: [updated, ...rest] }
    }),  

  messagePagination: {},
  setMessagePagination: (convId, info) =>
    set((s) => ({
      messagePagination: { ...s.messagePagination, [convId]: info },
    })),
}))