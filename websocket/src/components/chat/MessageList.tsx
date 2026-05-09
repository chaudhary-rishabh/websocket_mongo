'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
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
  /** Pagination */
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
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
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: MessageListProps) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomRef      = useRef<HTMLDivElement>(null)

  // Stable refs so the IntersectionObserver closure never goes stale
  const isLoadingMoreRef = useRef(isLoadingMore)
  const hasMoreRef       = useRef(hasMore)
  const onLoadMoreRef    = useRef(onLoadMore)

  useEffect(() => { isLoadingMoreRef.current = isLoadingMore }, [isLoadingMore])
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])
  useEffect(() => { onLoadMoreRef.current = onLoadMore }, [onLoadMore])

  const scrollHeightBeforeRef = useRef(0)

  const prevFirstMsgIdRef = useRef('')

  useLayoutEffect(() => {
    const firstId = realtimeMessages[0]?._id ?? ''
    if (
      firstId &&
      prevFirstMsgIdRef.current &&
      firstId !== prevFirstMsgIdRef.current &&
      scrollHeightBeforeRef.current > 0
    ) {
      const container = containerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight - scrollHeightBeforeRef.current
      }
      scrollHeightBeforeRef.current = 0
    }
    prevFirstMsgIdRef.current = firstId
  }, [realtimeMessages])

  const isNearBottomRef = useRef(true)
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mockMessages, realtimeMessages, typingUsernames])

  useEffect(() => {
    const sentinel  = topSentinelRef.current
    const container = containerRef.current
    if (!sentinel || !container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMoreRef.current && hasMoreRef.current && onLoadMoreRef.current) {
          scrollHeightBeforeRef.current = container.scrollHeight
          onLoadMoreRef.current()
        }
      },
      { root: container, threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-4"
    >
      <div ref={topSentinelRef} />

      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
        </div>
      )}

      {!hasMore && realtimeMessages.length > 0 && (
        <p className="text-center text-[10px] text-[#9CA3AF] py-1 select-none">
          Beginning of conversation
        </p>
      )}

      {mockMessages.map((message, index) => {
        const isMe    = message.senderId === CURRENT_USER.id
        const sender  = isMe ? CURRENT_USER : getUserById(message.senderId)
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
              isSelectMode && isSelected && 'bg-[#BFDBFE]/60',
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

      {realtimeMessages
        .filter((m) => !deletedIds.has(m._id))
        .map((message, index) => {
          const populated = message.senderId && typeof message.senderId === 'object'
            ? message.senderId as import('@/lib/chat-types').ApiMessageSender
            : null
          const senderId  = populated ? populated._id : (message.senderId as string) ?? ''
          const isMe      = !!myUserId && senderId === myUserId
          const isSelected = selectedIds.has(message._id)

          const adapted: Message = {
            id: message._id,
            conversationId: typeof message.conversationId === 'string'
              ? message.conversationId
              : String(message.conversationId),
            senderId,
            type: message.type as 'text' | 'image' | 'voice',
            content: message.content,
            timestamp: message.createdAt,
            viewCount: message.readBy.length,
            isRead: message.readBy.length > 0,
            isPending: message.isPending,
            editedAt: message.editedAt,
            reactions: message.reactions.reduce<{ emoji: string; count: number }[]>((acc, r) => {
              const existing = acc.find((x) => x.emoji === r.emoji)
              if (existing) existing.count++
              else acc.push({ emoji: r.emoji, count: 1 })
              return acc
            }, []),
          }

          const senderInfo = populated
            ? { id: populated._id, name: populated.displayName, avatar: populated.avatar, initials: populated.displayName.slice(0, 2).toUpperCase() }
            : senderMap[senderId]

          const adaptedSender = senderInfo
            ? { id: senderInfo.id, name: senderInfo.name, avatar: senderInfo.avatar ?? '', initials: senderInfo.initials, isOnline: false, lastSeen: '' }
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
                isSelectMode && isSelected && 'bg-[#BFDBFE]/60',
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

      <TypingIndicator usernames={typingUsernames} />

      <div ref={bottomRef} />
    </div>
  )
}
