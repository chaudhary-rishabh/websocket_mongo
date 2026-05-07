'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '@/lib/schemas'
import type { ApiMessage } from '@/lib/chat-types'
import { getUserById, CURRENT_USER } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface SenderInfo {
  id: string
  name: string
  avatar?: string
  initials: string
}

interface MessageListProps {
  /** Mock messages (for conv-* IDs) */
  mockMessages?: Message[]
  /** Real-time messages from WS store */
  realtimeMessages?: ApiMessage[]
  /** Map of userId -> sender info for real messages */
  senderMap?: Record<string, SenderInfo>
  isSelectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  deletedIds?: Set<string>
  typingUsernames?: string[]
  myUserId?: string
}

export default function MessageList({
  mockMessages = [],
  realtimeMessages = [],
  senderMap = {},
  isSelectMode,
  selectedIds,
  onToggleSelect,
  deletedIds = new Set(),
  typingUsernames = [],
  myUserId,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mockMessages, realtimeMessages, typingUsernames])

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-4">

      {/* ── Mock messages ── */}
      {mockMessages.map((message, index) => {
        const isMe = message.senderId === CURRENT_USER.id
        const sender = isMe ? CURRENT_USER : getUserById(message.senderId)
        const isSelected = selectedIds.has(message.id)

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            onClick={isSelectMode ? () => onToggleSelect(message.id) : undefined}
            className={cn(
              'flex rounded-2xl transition-colors duration-150',
              isMe ? 'justify-end' : 'justify-start',
              isSelectMode && 'cursor-pointer px-2 py-1',
              isSelectMode && isSelected && 'bg-[#E4D5C2]/60',
            )}
          >
            <MessageBubble
              message={message}
              sender={sender}
              isMe={isMe}
              isSelectMode={isSelectMode}
              isSelected={isSelected}
            />
          </motion.div>
        )
      })}

      {/* ── Real-time messages ── */}
      {realtimeMessages
        .filter((m) => !deletedIds.has(m._id))
        .map((message, index) => {
          const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id
          const isMe = senderId === myUserId
          const senderInfo = senderMap[senderId]
          const isSelected = selectedIds.has(message._id)

          // Adapt ApiMessage to the Message shape MessageBubble expects
          const adapted: Message = {
            id: message._id,
            conversationId: message.conversationId,
            senderId,
            type: message.type as 'text' | 'image' | 'voice',
            content: message.content,
            timestamp: message.createdAt,
            viewCount: message.readBy.length,
            isRead: message.readBy.length > 0,
            reactions: message.reactions.reduce<{ emoji: string; count: number }[]>((acc, r) => {
              const existing = acc.find((x) => x.emoji === r.emoji)
              if (existing) existing.count++
              else acc.push({ emoji: r.emoji, count: 1 })
              return acc
            }, []),
          }

          // Adapted sender in mock User shape
          const adaptedSender = senderInfo
            ? {
                id: senderInfo.id,
                name: senderInfo.name,
                avatar: senderInfo.avatar ?? '',
                initials: senderInfo.initials,
                isOnline: false,
                lastSeen: '',
              }
            : undefined

          return (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
              onClick={isSelectMode ? () => onToggleSelect(message._id) : undefined}
              className={cn(
                'flex rounded-2xl transition-colors duration-150',
                isMe ? 'justify-end' : 'justify-start',
                isSelectMode && 'cursor-pointer px-2 py-1',
                isSelectMode && isSelected && 'bg-[#E4D5C2]/60',
                message.isPending && 'opacity-60',
              )}
            >
              <MessageBubble
                message={adapted}
                sender={adaptedSender}
                isMe={isMe}
                isSelectMode={isSelectMode}
                isSelected={isSelected}
              />
            </motion.div>
          )
        })}

      {/* ── Typing indicator ── */}
      <TypingIndicator usernames={typingUsernames} />

      <div ref={bottomRef} />
    </div>
  )
}
