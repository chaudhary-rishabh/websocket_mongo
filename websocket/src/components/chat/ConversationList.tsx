'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, EyeOff, Eye, Trash2, X, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useChatStore } from '@/lib/store'
import { CONVERSATIONS } from '@/lib/mock-data'
import type { Conversation } from '@/lib/schemas'
import ConversationItem from './ConversationItem'
import { useRouter } from 'next/navigation'
import { formatTime } from '@/lib/utils'

interface ConversationListProps {
  activeTab: 'people' | 'groups'
  isSelectMode: boolean
  selectedIds: Set<string>
  deletedIds: Set<string>
  hiddenIds: Set<string>
  onToggleSelect: (id: string) => void
  onUnhideConv: (id: string) => void
  onDeleteHiddenConv: (id: string) => void
}

/* ─── Static hidden chats mock ───────────────────────────────────────── */
const STATIC_HIDDEN = [
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
interface HiddenChatsAccordionProps {
  dynamicHidden: Conversation[]
  onUnhide: (id: string) => void
  onDeleteHidden: (id: string) => void
}

function HiddenChatsAccordion({ dynamicHidden, onUnhide, onDeleteHidden }: HiddenChatsAccordionProps) {
  const [open, setOpen] = useState(false)
  const [miniSelect, setMiniSelect] = useState(false)
  const [selectedHidden, setSelectedHidden] = useState<Set<string>>(new Set())
  const [removedStatic, setRemovedStatic] = useState<Set<string>>(new Set())

  /* Build combined item list */
  const staticItems = STATIC_HIDDEN
    .filter((h) => !removedStatic.has(h.id))
    .map((h) => ({ ...h, isDynamic: false }))

  const dynamicItems = dynamicHidden.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar ?? '',
    initials: c.initials ?? c.name.slice(0, 2).toUpperCase(),
    lastMessage: c.lastMessage,
    time: formatTime(c.lastMessageTime),
    isOnline: false,
    isDynamic: true,
  }))

  const allItems = [...staticItems, ...dynamicItems]

  const toggleItem = (id: string) =>
    setSelectedHidden((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const removeItem = (id: string, isDynamic: boolean, action: 'unhide' | 'delete') => {
    if (isDynamic) {
      if (action === 'unhide') onUnhide(id)
      else onDeleteHidden(id)
    } else {
      setRemovedStatic((prev) => new Set([...prev, id]))
    }
  }

  const handleBulkUnhide = () => {
    selectedHidden.forEach((id) => {
      const item = allItems.find((i) => i.id === id)
      if (item) removeItem(id, item.isDynamic, 'unhide')
    })
    setSelectedHidden(new Set())
    setMiniSelect(false)
  }

  const handleBulkDelete = () => {
    selectedHidden.forEach((id) => {
      const item = allItems.find((i) => i.id === id)
      if (item) removeItem(id, item.isDynamic, 'delete')
    })
    setSelectedHidden(new Set())
    setMiniSelect(false)
  }

  const cancelMiniSelect = () => {
    setSelectedHidden(new Set())
    setMiniSelect(false)
  }

  const totalCount = allItems.length

  return (
    <div className="px-2 mb-1">
      {/* Trigger / mini-select header */}
      {miniSelect ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-[#EDE4D6]">
          <button
            onClick={handleBulkUnhide}
            disabled={selectedHidden.size === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#7C5C3E] hover:text-white hover:bg-[#7C5C3E] disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-xl border border-[#C4A882] hover:border-[#7C5C3E] transition-all duration-200 flex-shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            Unhide{selectedHidden.size > 0 ? ` (${selectedHidden.size})` : ''}
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedHidden.size === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-xl border border-red-200 hover:border-red-500 transition-all duration-200 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete{selectedHidden.size > 0 ? ` (${selectedHidden.size})` : ''}
          </button>
          <div className="flex-1" />
          <button
            onClick={cancelMiniSelect}
            className="p-1.5 rounded-full hover:bg-[#D4C4B0] transition-colors text-[#9A8474] flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl hover:bg-[#EDE4D6] transition-colors duration-200 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EDE4D6] group-hover:bg-[#E4D5C2] flex items-center justify-center flex-shrink-0 transition-colors duration-200">
            <EyeOff className="w-4 h-4 text-[#9B7653]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-[#2A1F14]">Hidden Chats</p>
            <p className="text-xs text-[#9A8474]">{totalCount} archived</p>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <ChevronDown className="w-4 h-4 text-[#9A8474] group-hover:text-[#7C5C3E] transition-colors duration-200" />
          </motion.div>
        </button>
      )}

      {/* Accordion body */}
      <AnimatePresence initial={false}>
        {(open || miniSelect) && (
          <motion.div
            key="hidden-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-1 pb-2 flex flex-col gap-0.5">
              {/* "Select" button — only visible in normal open mode */}
              {!miniSelect && allItems.length > 0 && (
                <button
                  onClick={() => setMiniSelect(true)}
                  className="self-end text-[10px] font-semibold text-[#9A8474] hover:text-[#7C5C3E] px-3 py-0.5 transition-colors"
                >
                  Select
                </button>
              )}

              {allItems.length === 0 && (
                <p className="text-center text-xs text-[#B0A090] py-4">No hidden chats</p>
              )}

              {allItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => miniSelect && toggleItem(item.id)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors duration-200 text-left hover:bg-[#EDE4D6] ${
                    miniSelect ? 'cursor-pointer' : ''
                  } ${miniSelect && selectedHidden.has(item.id) ? 'bg-[#E4D5C2]' : ''}`}
                >
                  {/* Checkbox in mini-select mode */}
                  {miniSelect && (
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
                      selectedHidden.has(item.id)
                        ? 'bg-[#7C5C3E] border-[#7C5C3E]'
                        : 'border-[#C4B4A0] bg-white'
                    }`}>
                      {selectedHidden.has(item.id) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D4C4B0]">
                      <Image
                        src={item.avatar}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {item.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#F6EEE3]" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#2A1F14] truncate">{item.name}</span>
                      <span className="text-[11px] text-[#B0A090] flex-shrink-0">{item.time}</span>
                    </div>
                    <p className="text-xs text-[#9A8474] truncate mt-0.5">{item.lastMessage}</p>
                  </div>

                  {/* Inline action buttons — normal mode only */}
                  {!miniSelect && (
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id, item.isDynamic, 'unhide') }}
                        className="p-1.5 rounded-lg hover:bg-[#D4C4B0] text-[#9B7653] transition-colors"
                        title="Unhide"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id, item.isDynamic, 'delete') }}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
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
  hiddenIds,
  onToggleSelect,
  onUnhideConv,
  onDeleteHiddenConv,
}: ConversationListProps) {
  const { activeConversationId, setActiveConversationId, realConversations } = useChatStore()
  const router = useRouter()

  // Adapt real API conversations to local Conversation shape
  const adaptedReal: Conversation[] = realConversations
    .filter((rc) => Array.isArray(rc.members))
    .map((rc) => {
      const memberNames = rc.members.map((p) => p.displayName).join(', ')
      return {
        id: rc._id,
        // backend uses 'dm', local schema uses 'direct'
        type: rc.type === 'dm' ? 'direct' : 'group',
        name: rc.name ?? memberNames,
        avatar: rc.avatar,
        initials: (rc.name ?? memberNames).slice(0, 2).toUpperCase(),
        members: rc.members.map((p) => p._id),
        onlineCount: rc.members.filter((p) => p.isOnline).length,
        lastMessage: rc.lastMessage?.content ?? '',
        lastMessageTime: rc.lastMessageTime ?? rc.createdAt,
        unreadCount: rc.unreadCount ?? 0,
        isPinned: rc.isPinned ?? false,
        lastMessageSentByMe: false,
      } satisfies Conversation
    })

  const typeFilter = activeTab === 'people' ? 'direct' : 'group'

  // Merge: real conversations first, then mock (no duplicates)
  const allConvs: Conversation[] = [
    ...adaptedReal,
    ...CONVERSATIONS.filter((c) => !adaptedReal.some((r) => r.id === c.id)),
  ]

  const visible = allConvs.filter(
    (c) => !deletedIds.has(c.id) && !hiddenIds.has(c.id) && c.type === typeFilter,
  )
  const pinned = visible.filter((c) => c.isPinned)
  const others = visible.filter((c) => !c.isPinned)

  /* Dynamic hidden convs for accordion (all types, all tabs — shown in People tab) */
  const dynamicHidden = allConvs.filter(
    (c) => hiddenIds.has(c.id) && !deletedIds.has(c.id),
  )

  const handleSelect = (id: string) => {
    setActiveConversationId(id)
    router.push(`/chat/${id}`)
  }

  const renderItem = (conv: Conversation) => (
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
      {activeTab === 'people' && !isSelectMode && (
        <HiddenChatsAccordion
          dynamicHidden={dynamicHidden}
          onUnhide={onUnhideConv}
          onDeleteHidden={onDeleteHiddenConv}
        />
      )}

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
