'use client'

import { useState } from 'react'
import { Paperclip, Mic, SendHorizonal } from 'lucide-react'
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
    // UI only: clear input
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
    <div className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
      <div
        className={cn(
          'flex items-center gap-2 bg-gray-50 border rounded-2xl px-3 py-2 transition-all duration-200',
          error ? 'border-red-300' : 'border-gray-200 focus-within:border-[#6C63FF]',
        )}
      >
        {/* Attach */}
        <button className="p-1.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
          <Paperclip className="w-4 h-4 text-gray-400" />
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
          placeholder="Your message…"
          className="flex-1 bg-transparent text-sm text-[#1A1A2E] placeholder-gray-400 outline-none"
        />

        {/* Mic */}
        <button className="p-1.5 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0">
          <Mic className="w-4 h-4 text-gray-400" />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!isValid}
          className={cn(
            'p-1.5 rounded-full transition-all duration-200 flex-shrink-0',
            isValid
              ? 'bg-[#6C63FF] hover:bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          )}
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mt-1 px-1">{error}</p>}
    </div>
  )
}
