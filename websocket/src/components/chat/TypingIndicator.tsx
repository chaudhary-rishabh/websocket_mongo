'use client'

import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  usernames: string[]
}

export default function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) return null

  const label =
    usernames.length === 1
      ? `${usernames[0]} is typing`
      : usernames.length === 2
        ? `${usernames[0]} and ${usernames[1]} are typing`
        : 'Several people are typing'

  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <div className="flex items-center gap-[3px] bg-white rounded-2xl px-3 py-2 shadow-sm border border-[#E0D5C5]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#9B7653]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-xs text-[#9A8474]">{label}…</span>
    </div>
  )
}
