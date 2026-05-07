'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  usernames: string[]
}

export default function TypingIndicator({ usernames }: TypingIndicatorProps) {
  const label =
    usernames.length === 0 ? null
    : usernames.length === 1 ? `${usernames[0]} is typing`
    : usernames.length === 2 ? `${usernames[0]} and ${usernames[1]} are typing`
    : 'Several people are typing'

  return (
    <AnimatePresence>
      {label && (
        <motion.div
          key="typing"
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="flex items-end gap-2 justify-start"
        >
          {/* Bubble with dots */}
          <div className="flex items-center gap-[5px] bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-[#E0D5C5]">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block w-2 h-2 rounded-full bg-[#C4A882]"
                animate={{ y: [0, -5, 0], backgroundColor: ['#C4A882', '#9B7653', '#C4A882'] }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          {/* Label */}
          <span className="text-xs text-[#9A8474] pb-1">{label}…</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
