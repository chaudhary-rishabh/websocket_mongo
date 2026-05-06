'use client'

import { useState } from 'react'
import { Search, Phone, MoreVertical, Menu, ChevronDown, CheckSquare, X } from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import type { Conversation } from '@/lib/schemas'
import Avatar from '@/components/ui/Avatar'
import { useChatStore } from '@/lib/store'
import GroupMembersModal from './GroupMembersModal'

interface ChatHeaderProps {
  conversation: Conversation
  isSelectMode: boolean
  onEnterSelectMode: () => void
  onExitSelectMode: () => void
}

export default function ChatHeader({
  conversation,
  isSelectMode,
  onEnterSelectMode,
  onExitSelectMode,
}: ChatHeaderProps) {
  const { toggleSidebar, setSearchOpen } = useChatStore()
  const [membersOpen, setMembersOpen] = useState(false)

  const isGroup = conversation.type === 'group'
  const subtitle = isGroup
    ? `${conversation.members.length} members${conversation.onlineCount ? `, ${conversation.onlineCount} online` : ''}`
    : 'Direct message'

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        {/* Mobile hamburger */}
        {!isSelectMode && (
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Avatar */}
        {!isSelectMode && (
          isGroup ? (
            <button onClick={() => setMembersOpen(true)}>
              <Avatar src={conversation.avatar} initials={conversation.initials} name={conversation.name} id={conversation.id} size="md" />
            </button>
          ) : (
            <Link href={`/user/${conversation.members.find((m) => m !== 'me') ?? ''}`}>
              <Avatar src={conversation.avatar} initials={conversation.initials} name={conversation.name} id={conversation.id} size="md" />
            </Link>
          )
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isSelectMode ? (
            <h1 className="text-base font-bold text-[#6C63FF]">Select Messages</h1>
          ) : isGroup ? (
            <button onClick={() => setMembersOpen(true)} className="flex items-center gap-1 group max-w-full">
              <h1 className="text-base font-bold text-[#1A1A2E] truncate group-hover:text-[#6C63FF] transition-colors duration-150">
                {conversation.name}
              </h1>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#6C63FF] transition-colors flex-shrink-0" />
            </button>
          ) : (
            <h1 className="text-base font-bold text-[#1A1A2E] truncate">{conversation.name}</h1>
          )}
          {!isSelectMode && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isSelectMode ? (
            /* Select mode: just a cancel button */
            <button
              onClick={onExitSelectMode}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#6C63FF] px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          ) : (
            /* Normal mode */
            <>
              <button
                onClick={onEnterSelectMode}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#6C63FF] px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Select messages"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Select
              </button>
              <button onClick={() => setSearchOpen(true)} className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200">
                <Search className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200">
                <Phone className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200">
                <MoreVertical className="w-4 h-4 text-gray-500" />
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
