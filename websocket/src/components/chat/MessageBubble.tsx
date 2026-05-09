'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Eye, SmilePlus, Check, Pencil, Loader2 } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import type { Message, User } from '@/lib/schemas'
import { cn, formatMessageTime } from '@/lib/utils'
import { CURRENT_USER } from '@/lib/mock-data'
import { wsClient } from '@/lib/ws-client'
import { authFetch } from '@/lib/api'
import { useChatStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import EmojiPicker from './EmojiPicker'

const REAL_ID = /^[0-9a-f]{24}$/i
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

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

function MetaRow({
  viewCount, timestamp, sent, isPending, isRead, editedAt,
}: {
  viewCount: number; timestamp: string; sent?: boolean; isPending?: boolean; isRead?: boolean; editedAt?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 text-[10px] mt-1 justify-end', sent ? 'text-[#3B82F6]/70' : 'text-[#6B7280]')}>
      {editedAt && (
        <span className="italic opacity-50 mr-0.5">edited</span>
      )}
      {sent ? (
        isPending ? (
          /* Single grey tick — optimistic, not yet confirmed */
          <Check className="w-3 h-3 text-[#9CA3AF]" strokeWidth={2.5} />
        ) : isRead ? (
          /* Double blue ticks — read by at least one person */
          <span className="flex items-center">
            <Check className="w-3 h-3 text-[#2563EB] -mr-1.5" strokeWidth={2.5} />
            <Check className="w-3 h-3 text-[#2563EB]" strokeWidth={2.5} />
          </span>
        ) : (
          /* Double grey ticks — delivered/sent, not yet read */
          <span className="flex items-center">
            <Check className="w-3 h-3 text-[#9CA3AF] -mr-1.5" strokeWidth={2.5} />
            <Check className="w-3 h-3 text-[#9CA3AF]" strokeWidth={2.5} />
          </span>
        )
      ) : (
        <>
          <Eye className="w-3 h-3" />
          <span>{viewCount}</span>
        </>
      )}
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
          className="inline-flex items-center gap-0.5 bg-white/80 border border-[#BFDBFE] hover:border-[#3B82F6]/40 hover:bg-[#F6EEE3] rounded-full px-2 py-0.5 text-[11px] shadow-sm transition-colors duration-150">
          {r.emoji}<span className="text-[#6B7280] font-medium">{r.count}</span>
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
        'flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white/70 border border-[#BFDBFE] shadow-sm self-center',
        'hover:bg-[#DBEAFE] hover:border-[#93C5FD] transition-all duration-150 focus:opacity-100',
        isMe ? 'order-first' : 'order-last',
      )}>
      <SmilePlus className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#2563EB]" />
    </button>
  )
}

function EditTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white/70 border border-[#BFDBFE] shadow-sm self-center order-first hover:bg-[#DBEAFE] hover:border-[#93C5FD] transition-all duration-150 focus:opacity-100"
      title="Edit message"
    >
      <Pencil className="w-3.5 h-3.5 text-[#6B7280] hover:text-[#2563EB]" />
    </button>
  )
}

function SelectCircle({ isSelected }: { isSelected: boolean }) {
  return (
    <div className={cn(
      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 self-center',
      isSelected ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#93C5FD] bg-white/60',
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
  const { data: session } = useSession()
  const { updateMessage } = useChatStore()

  const [reactions,  setReactions]  = useState<Reaction[]>(message.reactions ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)

  // ── Edit state ────────────────────────────────────────────────────────
  const [isEditing,  setIsEditing]  = useState(false)
  const [editValue,  setEditValue]  = useState('')
  const [isSaving,   setIsSaving]   = useState(false)
  const [editError,  setEditError]  = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus and select-all when edit mode opens
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const openEdit = () => {
    setEditValue(message.content)
    setEditError('')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditError('')
  }

  const saveEdit = async () => {
    const trimmed = editValue.trim()
    if (!trimmed) return
    if (trimmed === message.content) { cancelEdit(); return }
    if (!session?.accessToken) return

    setIsSaving(true)
    setEditError('')
    try {
      const res = await authFetch(
        `${API}/api/v1/conversations/${message.conversationId}/messages/${message.id}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: trimmed }) },
        session.accessToken,
      )
      const json = await res.json()
      if (json.success) {
        updateMessage(message.conversationId, json.data)
        setIsEditing(false)
      } else {
        setEditError(json?.error?.message ?? 'Could not save edit.')
      }
    } catch {
      setEditError('Network error. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void saveEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  const addReaction = (emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji)
      if (existing) return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
      return [...prev, { emoji, count: 1 }]
    })
    setPickerOpen(false)
    if (REAL_ID.test(message.id)) {
      wsClient.send({ type: 'ADD_REACTION', conversationId: message.conversationId, messageId: message.id, emoji })
    }
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
              <Link href={`/user/${sender.id}`} className="text-[11px] font-semibold text-[#3B82F6] mb-1 ml-1 hover:underline">
                {sender.name}
              </Link>
            )}
            <div className={cn(
              'rounded-2xl px-4 py-2.5 shadow-sm',
              isMe
                ? 'bg-[#DBEAFE] text-[#1F2937] rounded-br-sm'
                : 'bg-white text-[#1F2937] rounded-bl-sm',
              isEditing && 'ring-2 ring-[#2563EB]/40',
            )}>
              {isEditing ? (
                /* ── Inline edit ── */
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <textarea
                    ref={textareaRef}
                    rows={Math.max(1, editValue.split('\n').length)}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="w-full text-sm text-[#1F2937] bg-transparent border-b-2 border-[#2563EB] outline-none resize-none leading-relaxed"
                  />
                  {editError && (
                    <p className="text-[10px] text-red-400">{editError}</p>
                  )}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="text-[10px] font-medium text-[#6B7280] hover:text-[#1F2937] transition-colors px-1.5 py-0.5 rounded"
                    >
                      cancel
                    </button>
                    <button
                      onClick={() => void saveEdit()}
                      disabled={isSaving || !editValue.trim() || editValue.trim() === message.content}
                      className="flex items-center gap-1 text-[10px] font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1 rounded-lg transition-colors"
                    >
                      {isSaving && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}
              <MetaRow viewCount={message.viewCount} timestamp={message.timestamp} sent={isMe} isPending={message.isPending} isRead={message.isRead} editedAt={message.editedAt} />
            </div>
            <ReactionBar reactions={reactions} onAdd={addReaction} />
          </div>

          {!isSelectMode && isMe && !isEditing && REAL_ID.test(message.id) && (
            <EditTrigger onClick={openEdit} />
          )}
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
              <Link href={`/user/${sender.id}`} className="text-[11px] font-semibold text-[#3B82F6] mb-1 ml-1 hover:underline">
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
            <Link href={`/user/${sender.id}`} className="text-[11px] font-semibold text-[#3B82F6] mb-1 ml-1 hover:underline">
              {sender.name}
            </Link>
          )}
          <div className={cn(
            'rounded-2xl px-3 py-2.5 shadow-sm flex items-center gap-3 min-w-[200px]',
            isMe ? 'bg-[#DBEAFE] rounded-br-sm' : 'bg-white rounded-bl-sm',
          )}>
            <button className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
              isMe ? 'bg-[#2563EB]/20 hover:bg-[#2563EB]/30' : 'bg-[#2563EB] hover:bg-[#3B82F6]',
            )}>
              <Play className="w-4 h-4 text-white" fill="currentColor" />
            </button>
            <div className="flex items-center gap-[2px] flex-1">
              {WAVEFORM.map((h, i) => (
                <div key={i} style={{ height: `${h * 2}px` }} className={cn('w-[2px] rounded-full', isMe ? 'bg-[#2563EB]/50' : 'bg-[#2563EB]/60')} />
              ))}
            </div>
            <span className={cn('text-[11px] font-medium flex-shrink-0', isMe ? 'text-[#3B82F6]' : 'text-[#6B7280]')}>
              {message.content}
            </span>
          </div>
          <MetaRow viewCount={message.viewCount} timestamp={message.timestamp} sent={isMe} isPending={message.isPending} isRead={message.isRead} />
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
