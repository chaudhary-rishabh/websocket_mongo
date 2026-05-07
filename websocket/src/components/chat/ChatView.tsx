'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X } from 'lucide-react'
import { getConversationById, getMessages } from '@/lib/mock-data'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

interface ChatViewProps {
  conversationId: string
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const conversation = getConversationById(conversationId)!

  const [isSelectMode,  setIsSelectMode]  = useState(false)
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
  const [deletedIds,    setDeletedIds]    = useState<Set<string>>(new Set())

  const messages = getMessages(conversationId).filter((m) => !deletedIds.has(m.id))

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader
        conversation={conversation}
        isSelectMode={isSelectMode}
        onEnterSelectMode={() => setIsSelectMode(true)}
        onExitSelectMode={cancelSelect}
      />

      <MessageList
        messages={messages}
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

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
            <MessageInput />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
