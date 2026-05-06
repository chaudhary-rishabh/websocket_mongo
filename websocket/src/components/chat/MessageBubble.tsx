'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Eye, SmilePlus, Check } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import type { Message, User } from '@/lib/schemas'
import { cn, formatMessageTime } from '@/lib/utils'
import { CURRENT_USER } from '@/lib/mock-data'
import Avatar from '@/components/ui/Avatar'
import EmojiPicker from './EmojiPicker'

interface MessageBubbleProps {
  message: Message
  sender: User | undefined
  isMe: boolean
  isSelectMode?: boolean
  isSelected?: boolean
}

type Reaction = { emoji: string; count: number }

const WAVEFORM = [3, 6, 9, 7, 4, 8, 11, 6, 3, 7, 10, 5, 8, 6, 3, 7, 11, 6, 4, 8, 7, 9, 3, 5, 8]

/* ─── Shared helpers ──────────────────────────────────────────────────── */

function MetaRow({ viewCount, timestamp, white }: { viewCount: number; timestamp: string; white?: boolean }) {
  return (
    <div className={cn('flex items-center gap-1 text-[10px] mt-1 justify-end', white ? 'text-white/70' : 'text-gray-400')}>
      <Eye className="w-3 h-3" />
      <span>{viewCount}</span>
      <span className="ml-1">{formatMessageTime(timestamp)}</span>
    </div>
  )
}

function ReactionBar({ reactions, onAdd }: { reactions: Reaction[]; onAdd: (e: string) => void }) {
  if (reactions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => (
        <button key={r.emoji} onClick={() => onAdd(r.emoji)}
          className="inline-flex items-center gap-0.5 bg-white border border-gray-100 hover:border-[#6C63FF]/40 hover:bg-indigo-50 rounded-full px-2 py-0.5 text-[11px] shadow-sm transition-colors duration-150">
          {r.emoji}<span className="text-gray-500 font-medium">{r.count}</span>
        </button>
      ))}
    </div>
  )
}

function SenderAvatar({ sender }: { sender: User | undefined }) {
  if (!sender) return null
  return (
    <Link href={`/user/${sender.id}`} className="flex-shrink-0">
      <Avatar src={sender.avatar} initials={sender.initials} name={sender.name} id={sender.id} size="sm" />
    </Link>
  )
}

function MyAvatar() {
  return <Avatar src={CURRENT_USER.avatar} initials={CURRENT_USER.initials} name={CURRENT_USER.name} id="me" size="sm" />
}

function ReactionTrigger({ isMe, onClick }: { isMe: boolean; onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        'flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white border border-gray-200 shadow-sm self-center',
        'hover:bg-indigo-50 hover:border-[#6C63FF]/40 transition-all duration-150 focus:opacity-100',
        isMe ? 'order-first' : 'order-last',
      )}>
      <SmilePlus className="w-3.5 h-3.5 text-gray-400 hover:text-[#6C63FF]" />
    </button>
  )
}

function SelectCircle({ isSelected }: { isSelected: boolean }) {
  return (
    <div className={cn(
      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 self-center',
      isSelected ? 'bg-[#6C63FF] border-[#6C63FF]' : 'border-gray-300 bg-white',
    )}>
      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </div>
  )
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function MessageBubble({
  message, sender, isMe,
  isSelectMode = false,
  isSelected = false,
}: MessageBubbleProps) {
  const [reactions, setReactions] = useState<Reaction[]>(message.reactions ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)

  const addReaction = (emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji)
      if (existing) return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
      return [...prev, { emoji, count: 1 }]
    })
    setPickerOpen(false)
  }

  /* ─── Text ─── */
  if (message.type === 'text') {
    return (
      <>
        <div className={cn('group flex items-end gap-1.5 max-w-[75%]', isMe && 'flex-row-reverse')}>
          {isSelectMode && !isMe && <SelectCircle isSelected={isSelected} />}
          {!isMe && <SenderAvatar sender={sender} />}

          <div className={cn('flex flex-col min-w-0', isMe ? 'items-end' : 'items-start')}>
            {!isMe && sender && (
              <Link href={`/user/${sender.id}`} className="text-[11px] font-semibold text-[#6C63FF] mb-1 ml-1 hover:underline">
                {sender.name}
              </Link>
            )}
            <div className={cn('rounded-2xl px-4 py-2.5 shadow-sm', isMe ? 'bg-[#6C63FF] text-white rounded-br-sm' : 'bg-white text-[#1A1A2E] rounded-bl-sm')}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <MetaRow viewCount={message.viewCount} timestamp={message.timestamp} white={isMe} />
            </div>
            <ReactionBar reactions={reactions} onAdd={addReaction} />
          </div>

          {!isSelectMode && <ReactionTrigger isMe={isMe} onClick={() => setPickerOpen(true)} />}
          {isMe && <MyAvatar />}
          {isSelectMode && isMe && <SelectCircle isSelected={isSelected} />}
        </div>

        <AnimatePresence>
          {pickerOpen && !isSelectMode && (
            <EmojiPicker onSelect={addReaction} onClose={() => setPickerOpen(false)} />
          )}
        </AnimatePresence>
      </>
    )
  }

  /* ─── Image ─── */
  if (message.type === 'image') {
    return (
      <>
        <div className={cn('group flex items-end gap-1.5 max-w-[75%]', isMe && 'flex-row-reverse')}>
          {isSelectMode && !isMe && <SelectCircle isSelected={isSelected} />}
          {!isMe && <SenderAvatar sender={sender} />}

          <div className={cn('flex flex-col min-w-0', isMe ? 'items-end' : 'items-start')}>
            {!isMe && sender && (
              <Link href={`/user/${sender.id}`} className="text-[11px] font-semibold text-[#6C63FF] mb-1 ml-1 hover:underline">
                {sender.name}
              </Link>
            )}
            <div className="relative rounded-2xl overflow-hidden shadow-sm w-60">
              <div className="relative w-60 h-40">
                <Image src={message.content} alt="Shared image" fill className="object-cover" sizes="240px" />
              </div>
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[10px] text-white/90">
                <Eye className="w-3 h-3" />
                <span>{message.viewCount}</span>
                <span className="ml-1">{formatMessageTime(message.timestamp)}</span>
              </div>
            </div>
            <ReactionBar reactions={reactions} onAdd={addReaction} />
          </div>

          {!isSelectMode && <ReactionTrigger isMe={isMe} onClick={() => setPickerOpen(true)} />}
          {isMe && <MyAvatar />}
          {isSelectMode && isMe && <SelectCircle isSelected={isSelected} />}
        </div>

        <AnimatePresence>
          {pickerOpen && !isSelectMode && (
            <EmojiPicker onSelect={addReaction} onClose={() => setPickerOpen(false)} />
          )}
        </AnimatePresence>
      </>
    )
  }

  /* ─── Voice ─── */
  return (
    <>
      <div className={cn('group flex items-end gap-1.5 max-w-[75%]', isMe && 'flex-row-reverse')}>
        {isSelectMode && !isMe && <SelectCircle isSelected={isSelected} />}
        {!isMe && <SenderAvatar sender={sender} />}

        <div className={cn('flex flex-col min-w-0', isMe ? 'items-end' : 'items-start')}>
          {!isMe && sender && (
            <Link href={`/user/${sender.id}`} className="text-[11px] font-semibold text-[#6C63FF] mb-1 ml-1 hover:underline">
              {sender.name}
            </Link>
          )}
          <div className={cn('rounded-2xl px-3 py-2.5 shadow-sm flex items-center gap-3 min-w-[200px]', isMe ? 'bg-[#6C63FF] rounded-br-sm' : 'bg-white rounded-bl-sm')}>
            <button className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all', isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-[#6C63FF] hover:bg-indigo-600')}>
              <Play className="w-4 h-4 text-white" fill="currentColor" />
            </button>
            <div className="flex items-center gap-[2px] flex-1">
              {WAVEFORM.map((h, i) => (
                <div key={i} style={{ height: `${h * 2}px` }} className={cn('w-[2px] rounded-full', isMe ? 'bg-white/70' : 'bg-[#6C63FF]')} />
              ))}
            </div>
            <span className={cn('text-[11px] font-medium flex-shrink-0', isMe ? 'text-white/80' : 'text-gray-400')}>
              {message.content}
            </span>
          </div>
          <MetaRow viewCount={message.viewCount} timestamp={message.timestamp} white={false} />
          <ReactionBar reactions={reactions} onAdd={addReaction} />
        </div>

        {!isSelectMode && <ReactionTrigger isMe={isMe} onClick={() => setPickerOpen(true)} />}
        {isMe && <MyAvatar />}
        {isSelectMode && isMe && <SelectCircle isSelected={isSelected} />}
      </div>

      <AnimatePresence>
        {pickerOpen && !isSelectMode && (
          <EmojiPicker onSelect={addReaction} onClose={() => setPickerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
