'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ApiUser, ApiStory } from '@/lib/chat-types'
import { useViewStory } from '@/hooks/queries'

interface StoryViewerProps {
  user: ApiUser
  stories: ApiStory[]
  onClose: () => void
  onNextUser?: () => void
  onPrevUser?: () => void
  hasNextUser?: boolean
  hasPrevUser?: boolean
}

const STORY_DURATION = 5000

export default function StoryViewer({
  user,
  stories,
  onClose,
  onNextUser,
  onPrevUser,
  hasNextUser,
  hasPrevUser,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startRef = useRef(Date.now())
  const elapsedBeforePause = useRef(0)

  const viewStory = useViewStory()

  const currentStory = stories[currentIndex]

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else if (onNextUser) {
      onNextUser()
    } else {
      onClose()
    }
  }, [currentIndex, stories.length, onNextUser, onClose])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    } else if (onPrevUser) {
      onPrevUser()
    }
  }, [currentIndex, onPrevUser])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goToNext, goToPrev])

  useEffect(() => {
    if (!currentStory) return
    viewStory.mutate(currentStory._id)
  }, [currentStory?._id])

  useEffect(() => {
    setProgress(0)
    startRef.current = Date.now()
    elapsedBeforePause.current = 0

    if (paused) return

    const tick = () => {
      const elapsed = elapsedBeforePause.current + (Date.now() - startRef.current)
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100)
      setProgress(pct)

      if (pct >= 100) {
        goToNext()
      } else {
        timerRef.current = setTimeout(tick, 50)
      }
    }

    timerRef.current = setTimeout(tick, 50)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, paused, goToNext])

  const handlePause = () => {
    setPaused(true)
    elapsedBeforePause.current += Date.now() - startRef.current
  }

  const handleResume = () => {
    setPaused(false)
    startRef.current = Date.now()
  }

  if (!currentStory) return null

  return (
    <div
      className="absolute inset-0 z-30 bg-black/95 flex flex-col rounded-[25px] overflow-hidden"
      onMouseDown={handlePause}
      onMouseUp={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
    >
      {/* Progress bars */}
      <div className="absolute top-0 inset-x-0 z-20 flex gap-1 px-2 pt-3">
        {stories.map((s, i) => (
          <div key={s._id} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#2563EB]"
              initial={{ width: '0%' }}
              animate={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              }}
              transition={i === currentIndex ? { duration: 0.05, ease: 'linear' } : { duration: 0.2 }}
            />
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div className="absolute top-5 inset-x-0 z-20 flex items-center gap-3 px-4 pt-4">
        <img
          src={user.avatar ?? undefined}
          alt=""
          className="w-9 h-9 rounded-full object-cover border border-white/20 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
          <p className="text-[11px] text-white/60">
            {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation arrows */}
      {hasPrevUser && currentIndex === 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrev() }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {hasNextUser && currentIndex === stories.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext() }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Story image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStory._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex items-center justify-center"
        >
          <img
            src={currentStory.mediaUrl}
            alt=""
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-8 inset-x-0 flex justify-center px-6 z-20">
          <p className="text-sm text-white/90 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-2xl text-center max-w-sm">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 z-10 flex" style={{ marginTop: 40 }}>
        <div className="w-1/2 h-full" onClick={goToPrev} />
        <div className="w-1/2 h-full" onClick={goToNext} />
      </div>
    </div>
  )
}
