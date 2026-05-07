'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getConversationById, getMessages } from '@/lib/mock-data'
import { useChatStore } from '@/lib/store'
import { wsClient } from '@/lib/ws-client'
import type { ApiConversation, ApiMessage } from '@/lib/chat-types'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import type { Conversation } from '@/lib/schemas'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const REAL_ID = /^[0-9a-f]{24}$/i

interface ChatViewProps {
  conversationId: string
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const { data: session } = useSession()
  const isReal = REAL_ID.test(conversationId)

  const {
    realtimeMessages,
    appendMessage,
    prependMessages,
    typingUsers,
    realConversations,
  } = useChatStore()

  const [apiConversation, setApiConversation] = useState<ApiConversation | null>(null)
  const [isSelectMode,  setIsSelectMode]  = useState(false)
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
  const [deletedIds,    setDeletedIds]    = useState<Set<string>>(new Set())

  // ── Load real conversation & messages ──────────────────────────────────
  useEffect(() => {
    if (!isReal || !session?.accessToken) return

    // Find from cached list first
    const cached = realConversations.find((c) => c._id === conversationId)
    if (cached) setApiConversation(cached)

    // Load messages
    fetch(`${API}/api/v1/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const items = json.data?.items ?? json.data
        if (json.success && Array.isArray(items)) {
          prependMessages(conversationId, items as ApiMessage[])
        }
      })
      .catch(() => {/* ignore */})

    // Load conversation details if not cached
    if (!cached) {
      fetch(`${API}/api/v1/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((r) => r.json())
        .then((json) => { if (json.success) setApiConversation(json.data as ApiConversation) })
        .catch(() => {/* ignore */})
    }
  }, [isReal, conversationId, session?.accessToken, realConversations, prependMessages])

  // ── Join / leave WS room for real conversations ────────────────────────
  useEffect(() => {
    if (!isReal) return
    wsClient.send({ type: 'JOIN_CONVERSATION', conversationId })
    return () => { wsClient.send({ type: 'LEAVE_CONVERSATION', conversationId }) }
  }, [isReal, conversationId])

  // ── Message selection ──────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleDelete = () => {
    setDeletedIds((prev) => new Set([...prev, ...selectedIds]))
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }

  const cancelSelect = () => {
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }

  // ── Send ──────────────────────────────────────────────────────────────
  const handleSend = useCallback((content: string) => {
    if (isReal) {
      const tempId = crypto.randomUUID()
      // Optimistic message
      const optimistic: ApiMessage = {
        _id: tempId,
        conversationId,
        senderId: session?.user?.id ?? '',
        type: 'text',
        content,
        reactions: [],
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tempId,
        isPending: true,
      }
      appendMessage(conversationId, optimistic)
      wsClient.send({ type: 'SEND_MESSAGE', conversationId, tempId, messageType: 'text', content })
    }
    // For mock conversations we just display — no real send needed
  }, [isReal, conversationId, session?.user?.id, appendMessage])

  // ── Typing ────────────────────────────────────────────────────────────
  const handleTypingStart = useCallback(() => {
    if (isReal) wsClient.send({ type: 'TYPING_START', conversationId })
  }, [isReal, conversationId])

  const handleTypingStop = useCallback(() => {
    if (isReal) wsClient.send({ type: 'TYPING_STOP', conversationId })
  }, [isReal, conversationId])

  // ── Compute data to render ─────────────────────────────────────────────
  // Mock conversation path
  const mockConversation = !isReal ? getConversationById(conversationId) : null
  const conversation: Conversation | null = isReal
    ? (apiConversation && Array.isArray(apiConversation.members)
        ? (() => {
            const isDm = apiConversation.type === 'dm'
            // For DMs show only the OTHER person's name/avatar
            const other = isDm
              ? apiConversation.members.find((p) => p._id !== session?.user?.id)
              : null
            const displayName = isDm
              ? (other?.displayName ?? 'Unknown')
              : (apiConversation.name ?? apiConversation.members.map((p) => p.displayName).join(', '))
            return {
              id: apiConversation._id,
              type: isDm ? 'direct' : 'group',
              name: displayName,
              avatar: isDm ? other?.avatar : apiConversation.avatar,
              initials: displayName.slice(0, 2).toUpperCase(),
              lastMessage: apiConversation.lastMessage?.content ?? '',
              lastMessageTime: apiConversation.lastMessageTime ?? apiConversation.createdAt,
              members: apiConversation.members.map((p) => p._id),
              onlineCount: apiConversation.members.filter((p) => p.isOnline).length,
              isPinned: apiConversation.isPinned ?? false,
              unreadCount: apiConversation.unreadCount ?? 0,
              lastMessageSentByMe: false,
            } satisfies Conversation
          })()
        : null)
    : (mockConversation ?? null)

  // Build senderMap for real messages
  const senderMap: Record<string, { id: string; name: string; avatar?: string; initials: string }> = {}
  if (isReal && apiConversation && Array.isArray(apiConversation.members)) {
    for (const p of apiConversation.members) {
      senderMap[p._id] = {
        id: p._id,
        name: p.displayName,
        avatar: p.avatar,
        initials: p.displayName.slice(0, 2).toUpperCase(),
      }
    }
  }

  // Real messages from store; mock messages from mock-data
  const realtimeMsgs = realtimeMessages[conversationId] ?? []
  const mockMessages = !isReal ? getMessages(conversationId).filter((m) => !deletedIds.has(m.id)) : []

  // Typing usernames in this conversation (userId→username map)
  const typingMap = typingUsers[conversationId] ?? {}
  const typingUsernames = Object.entries(typingMap)
    .filter(([uid]) => uid !== session?.user?.id)
    .map(([, name]) => name)

  if (!conversation && !isReal) {
    return (
      <div className="flex items-center justify-center h-full text-[#9A8474] text-sm">
        Conversation not found
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Header floats above the message list so backdrop-blur shows blurred messages */}
      {conversation && (
        <div className="absolute inset-x-0 top-0 z-10 rounded-t-[25px] overflow-hidden">
          <ChatHeader
            conversation={conversation}
            isSelectMode={isSelectMode}
            selectedCount={selectedIds.size}
            onEnterSelectMode={() => setIsSelectMode(true)}
            onExitSelectMode={cancelSelect}
            onDeleteSelected={handleDelete}
          />
        </div>
      )}

      {/* Top padding pushes message content below the floating header */}
      <div className={`flex flex-col flex-1 overflow-hidden ${conversation ? 'pt-[68px]' : ''}`}>
        <MessageList
          mockMessages={mockMessages}
          realtimeMessages={realtimeMsgs}
          senderMap={senderMap}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          deletedIds={deletedIds}
          typingUsernames={typingUsernames}
          myUserId={session?.user?.id}
        />
      </div>

      {/* Footer: delete bar or input */}
      <AnimatePresence mode="wait">
        {isSelectMode ? (
          <motion.div
            key="select-bar"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="flex-shrink-0 border-t border-[#E0D5C5] px-4 py-3 flex items-center gap-3"
          >
            <button
              onClick={cancelSelect}
              className="p-2 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="flex-1 text-sm text-[#9A8474] text-center">
              {selectedIds.size === 0
                ? 'Tap messages to select'
                : `${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''} selected`}
            </span>
            <button
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          >
            <MessageInput
              onSend={handleSend}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
