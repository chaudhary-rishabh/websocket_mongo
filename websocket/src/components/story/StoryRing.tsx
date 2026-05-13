'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StoryRingProps {
  hasStories: boolean
  children: React.ReactNode
  onClick?: (e?: React.MouseEvent) => void
  isOwnStory?: boolean
  className?: string
}

export default function StoryRing({ hasStories, children, onClick, isOwnStory, className }: StoryRingProps) {
  if (!hasStories) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn('relative inline-flex rounded-full flex-shrink-0', className)}
      >
        {children}
        {isOwnStory && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center border-2 border-white">
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </span>
        )}
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn('relative inline-flex rounded-full flex-shrink-0 p-[2px]', className)}
      animate={{
        boxShadow: [
          '0 0 0 0px rgba(37,99,235,0.4)',
          '0 0 0 5px rgba(37,99,235,0.1)',
          '0 0 0 0px rgba(37,99,235,0.4)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] p-[2px]">
        <span className="block rounded-full bg-white p-[1px]">
          {children}
        </span>
      </span>
      {isOwnStory && (
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#2563EB] rounded-full flex items-center justify-center border-2 border-white">
          <Plus className="w-3 h-3 text-white" strokeWidth={3} />
        </span>
      )}
    </motion.button>
  )
}
