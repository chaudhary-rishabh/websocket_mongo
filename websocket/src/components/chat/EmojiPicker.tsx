'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const CATEGORIES = [
  {
    icon: '😀',
    label: 'Smileys',
    emojis: [
      '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃',
      '😉','😌','😍','🥰','😘','😋','😛','😝','😜','🤪','🤨','🧐',
      '🤓','😎','🥸','🤩','🥳','😏','😒','😔','😟','🙁','😣','😫',
      '🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱',
    ],
  },
  {
    icon: '👍',
    label: 'Gestures',
    emojis: [
      '👍','👎','👌','🤌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆',
      '👇','☝️','✋','🖐️','🖖','👋','🤚','💪','🤝','👏','🙌','🤲','🙏',
    ],
  },
  {
    icon: '❤️',
    label: 'Hearts',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥',
      '💕','💞','💓','💗','💖','💝','💘','💟','♥️',
    ],
  },
  {
    icon: '🎉',
    label: 'Celebrate',
    emojis: [
      '🎉','🎊','🎈','🎁','🎀','🏆','🥇','🥈','🥉','🎯','🎮','🎲',
      '🎭','🎨','✨','💫','⭐','🌟','🔥','💥','🌈','🎵','🎶','🎤',
    ],
  },
  {
    icon: '🌸',
    label: 'Nature',
    emojis: [
      '🌸','🌺','🌻','🌹','🌷','🌼','🪷','💐','🌿','🍀','🌱','🌲',
      '🌳','🌴','🪴','🌵','🌾','🍃','🍂','🍁','🐶','🐱','🐭','🐰',
      '🦊','🐻','🐼','🐨','🐯','🦁',
    ],
  },
  {
    icon: '🍎',
    label: 'Food',
    emojis: [
      '🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥝','🍅',
      '🥑','🍆','🥦','🌽','🥕','🧄','🍕','🍔','🍟','🌭','🍿','🍦',
      '🍰','🎂','🍩','🍪','🍫','🍬',
    ],
  },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="emoji-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/25"
          onClick={onClose}
        />

        {/* Panel — bottom sheet on mobile, centered card on desktop */}
        <motion.div
          key="emoji-panel"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="fixed bottom-0 left-0 right-0 md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-[#F6EEE3] border border-[#E0D5C5] rounded-t-3xl md:rounded-[20px] shadow-2xl w-full md:w-[360px] flex flex-col overflow-hidden"
          style={{ maxHeight: '60vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
            <span className="text-sm font-semibold text-[#2A1F14]">React</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#EDE4D6] transition-colors"
            >
              <X className="w-4 h-4 text-[#9A8474]" />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 px-3 pb-2 flex-shrink-0 border-b border-[#E0D5C5]">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(i)}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-base transition-colors duration-150 ${
                  activeCategory === i
                    ? 'bg-[#EDE4D6] ring-1 ring-[#9B7653]/30'
                    : 'hover:bg-[#EDE4D6]'
                }`}
                title={cat.label}
              >
                {cat.icon}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="overflow-y-auto chat-scrollbar p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A8474] mb-2">
              {CATEGORIES[activeCategory].label}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {CATEGORIES[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="flex items-center justify-center w-9 h-9 text-xl rounded-xl hover:bg-[#EDE4D6] active:scale-90 transition-all duration-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
