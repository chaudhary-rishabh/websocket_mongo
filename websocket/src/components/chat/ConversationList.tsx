'use client'

import { useChatStore } from '@/lib/store'
import { CONVERSATIONS } from '@/lib/mock-data'
import ConversationItem from './ConversationItem'
import { useRouter } from 'next/navigation'

interface ConversationListProps {
  isSelectMode: boolean
  selectedIds: Set<string>
  deletedIds: Set<string>
  onToggleSelect: (id: string) => void
}

export default function ConversationList({
  isSelectMode,
  selectedIds,
  deletedIds,
  onToggleSelect,
}: ConversationListProps) {
  const { activeConversationId, setActiveConversationId } = useChatStore()
  const router = useRouter()

  const visible = CONVERSATIONS.filter((c) => !deletedIds.has(c.id))
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
    <div className="flex flex-col gap-1 px-2">
      {pinned.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 pt-2 pb-1">
            Pinned
          </p>
          {pinned.map(renderItem)}
          <div className="h-px bg-gray-100 mx-2 my-1" />
        </>
      )}
      {others.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-2 pb-1">
            All Chats
          </p>
          {others.map(renderItem)}
        </>
      )}
      {visible.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">No conversations</p>
      )}
    </div>
  )
}
