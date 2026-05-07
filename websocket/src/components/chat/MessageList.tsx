'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '@/lib/schemas'
import { getUserById, CURRENT_USER } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  isSelectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}

export default function MessageList({ messages, isSelectMode, selectedIds, onToggleSelect }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-4">
      {messages.map((message, index) => {
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
      <div ref={bottomRef} />
    </div>
  )
}
