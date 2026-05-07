'use client'

import { useState } from 'react'
import { Paperclip, Mic, SendHorizonal, Smile } from 'lucide-react'
import { MessageInputSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'

export default function MessageInput() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isValid = MessageInputSchema.safeParse({ content: value }).success

  const handleSend = () => {
    const result = MessageInputSchema.safeParse({ content: value })
    if (!result.success) {
      setError('Message cannot be empty.')
      return
    }
    setValue('')
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 py-3 border-t border-[#E0D5C5] flex-shrink-0">
      <div
        className={cn(
          'flex items-center gap-2 bg-white/70 border rounded-2xl px-3 py-2.5 transition-all duration-200',
          error ? 'border-red-300' : 'border-[#E0D5C5] focus-within:border-[#9B7653] focus-within:bg-white/90',
        )}
      >
        {/* Emoji */}
        <button className="p-1.5 rounded-full hover:bg-[#EDE4D6] transition-colors flex-shrink-0">
          <Smile className="w-4 h-4 text-[#9A8474]" />
        </button>

        {/* Attach */}
        <button className="p-1.5 rounded-full hover:bg-[#EDE4D6] transition-colors flex-shrink-0">
          <Paperclip className="w-4 h-4 text-[#9A8474]" />
        </button>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 bg-transparent text-sm text-[#2A1F14] placeholder-[#B0A090] outline-none"
        />

        {/* Mic */}
        <button className="p-1.5 rounded-full hover:bg-[#EDE4D6] transition-colors flex-shrink-0">
          <Mic className="w-4 h-4 text-[#9A8474]" />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!isValid}
          className={cn(
            'p-2 rounded-full transition-all duration-200 flex-shrink-0',
            isValid
              ? 'bg-[#7C5C3E] hover:bg-[#9B7653] text-white shadow-sm'
              : 'bg-[#E4D5C2] text-[#B0A090] cursor-not-allowed',
          )}
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mt-1 px-1">{error}</p>}
    </div>
  )
}
