import { create } from 'zustand'
import type { ApiMessage, ApiMessageSender, ApiConversation } from './chat-types'

interface TypingState {
  /** conversationId → Set of userIds currently typing */
  typingUsers: Record<string, Set<string>>
}

interface ChatStore {
  // ── Navigation ───────────────────────────────────────────────────────
  activeConversationId: string | null
  setActiveConversationId: (id: string) => void

  // ── Search ───────────────────────────────────────────────────────────
  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void

  // ── Sidebar ──────────────────────────────────────────────────────────
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // ── WebSocket ────────────────────────────────────────────────────────
  wsConnected: boolean
  setWsConnected: (v: boolean) => void

  // ── Real-time messages (keyed by conversationId) ─────────────────────
  realtimeMessages: Record<string, ApiMessage[]>
  appendMessage: (convId: string, msg: ApiMessage) => void
  replaceTempMessage: (convId: string, tempId: string, msg: ApiMessage) => void
  prependMessages: (convId: string, msgs: ApiMessage[]) => void
  markMessagesRead: (convId: string, userId: string, readAt: string) => void

  // ── Typing — convId → { userId: displayName } ────────────────────────
  typingUsers: Record<string, Record<string, string>>
  setTyping: (convId: string, userId: string, username: string, isTyping: boolean) => void

  // ── Online presence ──────────────────────────────────────────────────
  onlineUserIds: Set<string>
  setUserOnline: (userId: string) => void
  setUserOffline: (userId: string) => void

  // ── Real conversations from API ──────────────────────────────────────
  realConversations: ApiConversation[]
  setRealConversations: (convs: ApiConversation[]) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  // Navigation
  activeConversationId: 'conv-1',
  setActiveConversationId: (id) => set({ activeConversationId: id, isSidebarOpen: false }),

  // Search
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  // Sidebar
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // WebSocket
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  // Real-time messages
  realtimeMessages: {},
  appendMessage: (convId, msg) =>
    set((s) => {
      const prev = s.realtimeMessages[convId] ?? []
      // Avoid duplicates
      if (prev.some((m) => m._id === msg._id)) return s
      return { realtimeMessages: { ...s.realtimeMessages, [convId]: [...prev, msg] } }
    }),
  replaceTempMessage: (convId, tempId, msg) =>
    set((s) => {
      const prev = s.realtimeMessages[convId] ?? []
      const idx = prev.findIndex((m) => m.tempId === tempId)
      if (idx === -1) {
        // Not found — just append (may already exist with correct _id)
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

  // Typing
  typingUsers: {},
  setTyping: (convId, userId, username, isTyping) =>
    set((s) => {
      const prev = { ...(s.typingUsers[convId] ?? {}) }
      if (isTyping) prev[userId] = username
      else delete prev[userId]
      return { typingUsers: { ...s.typingUsers, [convId]: prev } }
    }),

  // Online presence
  onlineUserIds: new Set(),
  setUserOnline: (userId) =>
    set((s) => ({ onlineUserIds: new Set([...s.onlineUserIds, userId]) })),
  setUserOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds)
      next.delete(userId)
      return { onlineUserIds: next }
    }),

  // Real conversations
  realConversations: [],
  setRealConversations: (convs) => set({ realConversations: convs }),
}))
