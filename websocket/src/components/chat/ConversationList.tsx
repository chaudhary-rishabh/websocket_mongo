'use client'

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
    <div className="flex flex-col gap-0.5 px-2">
      {pinned.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A8474] px-3 pt-2 pb-1">
            Pinned
          </p>
          {pinned.map(renderItem)}
          <div className="h-px bg-[#E0D5C5] mx-3 my-1" />
        </>
      )}
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
