'use client'

import { Check, Pin } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import type { Conversation } from '@/lib/schemas'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  isSelectMode: boolean
  isSelected: boolean
  onClick: () => void
  onToggleSelect: () => void
}

export default function ConversationItem({
  conversation,
  isActive,
  isSelectMode,
  isSelected,
  onClick,
  onToggleSelect,
}: ConversationItemProps) {
  const { name, avatar, initials, id, lastMessage, lastMessageTime, unreadCount, isPinned, lastMessageSentByMe } = conversation

  const handleClick = () => {
    if (isSelectMode) onToggleSelect()
    else onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-200 rounded-2xl',
        isSelectMode
          ? isSelected
            ? 'bg-[#E4D5C2]'
            : 'hover:bg-[#EDE4D6]'
          : isActive
            ? 'bg-[#E4D5C2] hover:bg-[#DFD0BC]'
            : 'hover:bg-[#EDE4D6]',
      )}
    >
      {/* Checkbox (select mode) */}
      {isSelectMode && (
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150',
          isSelected ? 'bg-[#7C5C3E] border-[#7C5C3E]' : 'border-[#C4B4A0] bg-white/60',
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      )}

      {/* Avatar */}
      <Avatar src={avatar} initials={initials} name={name} id={id} size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'text-sm font-semibold truncate',
            isActive && !isSelectMode ? 'text-[#7C5C3E]' : 'text-[#2A1F14]',
          )}>
            {name}
          </span>
          <span className="text-[11px] text-[#B0A090] flex-shrink-0">{formatTime(lastMessageTime)}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0">
            {lastMessageSentByMe && unreadCount === 0 && (
              <span className="flex-shrink-0 flex">
                <Check className="w-3 h-3 text-[#B0A090] -mr-1.5" />
                <Check className="w-3 h-3 text-[#B0A090]" />
              </span>
            )}
            <p className="text-xs text-[#9A8474] truncate">{lastMessage}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isPinned && !isSelectMode && <Pin className="w-3 h-3 text-[#9B7653] fill-[#9B7653]" />}
            {!isSelectMode && <Badge count={unreadCount} />}
          </div>
        </div>
      </div>
    </button>
  )
}
