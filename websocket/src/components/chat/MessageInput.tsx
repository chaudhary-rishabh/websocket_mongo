'use client'

import { useState, useRef, useCallback } from 'react'
import { Paperclip, Mic, SendHorizonal, Smile } from 'lucide-react'
import { MessageInputSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSend?: (content: string) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
}

const TYPING_STOP_DELAY = 1500

export default function MessageInput({ onSend, onTypingStart, onTypingStop }: MessageInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const typingRef = useRef(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerTypingStop = useCallback(() => {
    if (typingRef.current) {
      typingRef.current = false
      onTypingStop?.()
    }
  }, [onTypingStop])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (error) setError(null)

    if (e.target.value.length > 0) {
      if (!typingRef.current) {
        typingRef.current = true
        onTypingStart?.()
      }
      // Reset debounce timer
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(triggerTypingStop, TYPING_STOP_DELAY)
    } else {
      // Empty input — stop typing immediately
      if (typingTimer.current) clearTimeout(typingTimer.current)
      triggerTypingStop()
    }
  }

  const handleSend = () => {
    const result = MessageInputSchema.safeParse({ content: value })
    if (!result.success) {
      setError('Message cannot be empty.')
      return
    }
    const content = value.trim()
    setValue('')
    setError(null)
    // Stop typing on send
    if (typingTimer.current) clearTimeout(typingTimer.current)
    triggerTypingStop()
    onSend?.(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isValid = value.trim().length > 0

  return (
    <div className="px-4 py-3 border-t border-[#BFDBFE] flex-shrink-0">
      <div
        className={cn(
          'flex items-center gap-2 bg-white/70 border rounded-2xl px-3 py-2.5 transition-all duration-200',
          error ? 'border-red-300' : 'border-[#BFDBFE] focus-within:border-[#3B82F6] focus-within:bg-white/90',
        )}
      >
        {/* Emoji */}
        <button className="p-1.5 rounded-full hover:bg-[#DBEAFE] transition-colors flex-shrink-0">
          <Smile className="w-4 h-4 text-[#6B7280]" />
        </button>

        {/* Attach */}
        <button className="p-1.5 rounded-full hover:bg-[#DBEAFE] transition-colors flex-shrink-0">
          <Paperclip className="w-4 h-4 text-[#6B7280]" />
        </button>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 bg-transparent text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none"
        />

        {/* Mic */}
        <button className="p-1.5 rounded-full hover:bg-[#DBEAFE] transition-colors flex-shrink-0">
          <Mic className="w-4 h-4 text-[#6B7280]" />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!isValid}
          className={cn(
            'p-2 rounded-full transition-all duration-200 flex-shrink-0',
            isValid
              ? 'bg-[#2563EB] hover:bg-[#3B82F6] text-white shadow-sm'
              : 'bg-[#BFDBFE] text-[#9CA3AF] cursor-not-allowed',
          )}
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mt-1 px-1">{error}</p>}
    </div>
  )
}
