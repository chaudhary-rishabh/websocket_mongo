'use client'

import { useState } from 'react'
import { Search, Phone, MoreVertical, Menu, ChevronDown, CheckSquare, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import type { Conversation } from '@/lib/schemas'
import Avatar from '@/components/ui/Avatar'
import { useChatStore } from '@/lib/store'
import GroupMembersModal from './GroupMembersModal'

interface ChatHeaderProps {
  conversation: Conversation
  isSelectMode: boolean
  selectedCount: number
  onEnterSelectMode: () => void
  onExitSelectMode: () => void
  onDeleteSelected: () => void
}

export default function ChatHeader({
  conversation,
  isSelectMode,
  selectedCount,
  onEnterSelectMode,
  onExitSelectMode,
  onDeleteSelected,
}: ChatHeaderProps) {
  const { toggleSidebar, setSearchOpen } = useChatStore()
  const { data: session } = useSession()
  const [membersOpen, setMembersOpen] = useState(false)

  const isGroup = conversation.type === 'group'
  const subtitle = isGroup
    ? `${conversation.members.length} members${conversation.onlineCount ? ` · ${conversation.onlineCount} online` : ''}`
    : 'Direct message'

  // For DMs: find the other person's ID for the profile link
  const otherUserId = !isGroup
    ? conversation.members.find((m) => m !== session?.user?.id) ?? conversation.members[0]
    : null

  return (
    <>
      <header className="flex items-center gap-3 px-5 py-3.5 header-glass flex-shrink-0">
        {/* Mobile hamburger */}
        {!isSelectMode && (
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Avatar */}
        {!isSelectMode && (
          isGroup ? (
            <button onClick={() => setMembersOpen(true)}>
              <Avatar src={conversation.avatar} initials={conversation.initials} name={conversation.name} id={conversation.id} size="md" />
            </button>
          ) : (
            <Link href={`/user/${otherUserId ?? ''}`}>
              <Avatar src={conversation.avatar} initials={conversation.initials} name={conversation.name} id={conversation.id} size="md" />
            </Link>
          )
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isSelectMode ? (
            <h1 className="text-base font-bold text-[#7C5C3E]">Select Messages</h1>
          ) : isGroup ? (
            <button onClick={() => setMembersOpen(true)} className="flex items-center gap-1 group max-w-full text-left">
              <h1 className="text-base font-bold text-[#2A1F14] truncate group-hover:text-[#7C5C3E] transition-colors duration-150">
                {conversation.name}
              </h1>
              <ChevronDown className="w-3.5 h-3.5 text-[#9A8474] group-hover:text-[#7C5C3E] transition-colors flex-shrink-0" />
            </button>
          ) : (
            <Link href={`/user/${otherUserId ?? ''}`} className="group block">
              <h1 className="text-base font-bold text-[#2A1F14] truncate group-hover:text-[#7C5C3E] transition-colors duration-150">
                {conversation.name}
              </h1>
            </Link>
          )}
          {!isSelectMode && <p className="text-xs text-[#9A8474]">{subtitle}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {isSelectMode ? (
            <>
              <button
                onClick={onDeleteSelected}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-xl border border-red-200 hover:border-red-500 transition-all duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </button>
              <button
                onClick={onExitSelectMode}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#9A8474] hover:text-[#7C5C3E] px-2 py-1.5 rounded-xl hover:bg-[#EDE4D6] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEnterSelectMode}
                className="flex items-center gap-1 text-xs font-semibold text-[#9A8474] hover:text-[#7C5C3E] px-2 py-1.5 rounded-xl hover:bg-[#EDE4D6] transition-colors"
                title="Select messages"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Select
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full hover:bg-[#EDE4D6] transition-all duration-200 text-[#9A8474] hover:text-[#7C5C3E]"
              >
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-[#EDE4D6] transition-all duration-200 text-[#9A8474] hover:text-[#7C5C3E]">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-[#EDE4D6] transition-all duration-200 text-[#9A8474] hover:text-[#7C5C3E]">
                <MoreVertical className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      <AnimatePresence>
        {membersOpen && (
          <GroupMembersModal conversation={conversation} onClose={() => setMembersOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
