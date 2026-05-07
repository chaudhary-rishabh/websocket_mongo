'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, EyeOff } from 'lucide-react'
import { useChatStore } from '@/lib/store'
import { CONVERSATIONS } from '@/lib/mock-data'
import ConversationItem from './ConversationItem'
import { useRouter } from 'next/navigation'

interface ConversationListProps {
  activeTab: 'people' | 'groups'
  isSelectMode: boolean
  selectedIds: Set<string>
  deletedIds: Set<string>
  onToggleSelect: (id: string) => void
}

/* ─── Hidden chats mock data ─────────────────────────────────────────── */
const HIDDEN_CHATS = [
  {
    id: 'hidden-1',
    name: 'Sarah Connor',
    avatar: 'https://i.pravatar.cc/150?img=47',
    initials: 'SC',
    lastMessage: 'See you tomorrow! 👋',
    time: '2d',
    isOnline: false,
  },
  {
    id: 'hidden-2',
    name: 'Marcus Webb',
    avatar: 'https://i.pravatar.cc/150?img=52',
    initials: 'MW',
    lastMessage: 'Thanks for the update',
    time: '5d',
    isOnline: true,
  },
]

/* ─── Hidden chats accordion ─────────────────────────────────────────── */
function HiddenChatsAccordion() {
  const [open, setOpen] = useState(false)

  return (
    <div className="px-2 mb-1">
      {/* Trigger row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-[#EDE4D6] transition-colors duration-200 group"
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-[#EDE4D6] group-hover:bg-[#E4D5C2] flex items-center justify-center flex-shrink-0 transition-colors duration-200">
          <EyeOff className="w-4 h-4 text-[#9B7653]" />
        </div>

        {/* Label + count */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-[#2A1F14]">Hidden Chats</p>
          <p className="text-xs text-[#9A8474]">{HIDDEN_CHATS.length} archived</p>
        </div>

        {/* Animated chevron */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          <ChevronDown className="w-4 h-4 text-[#9A8474] group-hover:text-[#7C5C3E] transition-colors duration-200" />
        </motion.div>
      </button>

      {/* Accordion body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="hidden-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-1 pb-2 flex flex-col gap-0.5">
              {HIDDEN_CHATS.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-[#EDE4D6] transition-colors duration-200 text-left"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D4C4B0]">
                      <Image
                        src={chat.avatar}
                        alt={chat.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {chat.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#F6EEE3]" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#2A1F14] truncate">{chat.name}</span>
                      <span className="text-[11px] text-[#B0A090] flex-shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-xs text-[#9A8474] truncate mt-0.5">{chat.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main list ──────────────────────────────────────────────────────── */
export default function ConversationList({
  activeTab,
  isSelectMode,
  selectedIds,
  deletedIds,
  onToggleSelect,
}: ConversationListProps) {
  const { activeConversationId, setActiveConversationId } = useChatStore()
  const router = useRouter()

  const typeFilter = activeTab === 'people' ? 'direct' : 'group'
  const visible = CONVERSATIONS.filter(
    (c) => !deletedIds.has(c.id) && c.type === typeFilter,
  )
  const pinned = visible.filter((c) => c.isPinned)
  const others = visible.filter((c) => !c.isPinned)

  const handleSelect = (id: string) => {
    setActiveConversationId(id)
    router.push(`/chat/${id}`)
  }

  const renderItem = (conv: (typeof CONVERSATIONS)[0]) => (
    <ConversationItem
      key={conv.id}
      conversation={conv}
      isActive={activeConversationId === conv.id}
      isSelectMode={isSelectMode}
      isSelected={selectedIds.has(conv.id)}
      onClick={() => handleSelect(conv.id)}
      onToggleSelect={() => onToggleSelect(conv.id)}
    />
  )

  return (
    <div className="flex flex-col gap-0.5 px-2 pb-2">

      {/* ── Hidden chats accordion — only in People tab ── */}
      {activeTab === 'people' && !isSelectMode && <HiddenChatsAccordion />}

      {/* ── Pinned ── */}
      {pinned.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A8474] px-3 pt-2 pb-1">
            Pinned
          </p>
          {pinned.map(renderItem)}
          <div className="h-px bg-[#E0D5C5] mx-3 my-1" />
        </>
      )}

      {/* ── Others ── */}
      {others.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A8474] px-3 pb-1">
            {activeTab === 'people' ? 'Direct Messages' : 'Groups'}
          </p>
          {others.map(renderItem)}
        </>
      )}

      {visible.length === 0 && (
        <p className="text-center text-sm text-[#B0A090] py-10">
          {activeTab === 'people' ? 'No direct messages' : 'No groups yet'}
        </p>
      )}
    </div>
  )
}
