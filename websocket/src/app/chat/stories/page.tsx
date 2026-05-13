'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Camera, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { authFetch } from '@/lib/api'
import { useChatStore } from '@/lib/store'
import type { ApiStoryGroup, ApiUser } from '@/lib/chat-types'
import StoryRing from '@/components/story/StoryRing'
import StoryViewer from '@/components/story/StoryViewer'
import AddStoryModal from '@/components/story/AddStoryModal'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function StoriesPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<ApiStoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeGroupIdx, setActiveGroupIdx] = useState(0)
  const [addOpen, setAddOpen] = useState(false)

  const fetchStories = async () => {
    try {
      const res = await authFetch(`${API}/api/v1/stories`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setGroups(json.data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStories() }, [])

  const openViewer = (idx: number) => {
    setActiveGroupIdx(idx)
    setViewerOpen(true)
  }

  const goToNextUser = () => {
    if (activeGroupIdx < groups.length - 1) {
      setActiveGroupIdx((i) => i + 1)
    } else {
      setViewerOpen(false)
    }
  }

  const goToPrevUser = () => {
    if (activeGroupIdx > 0) {
      setActiveGroupIdx((i) => i - 1)
    }
  }

  const myId = session?.user?.id
  const myGroups = groups.filter((g) => (g.user as ApiUser)._id === myId)
  const myStoryCount = myGroups.reduce((sum, g) => sum + g.stories.length, 0)
  const otherGroups = groups.filter((g) => (g.user as ApiUser)._id !== myId)

  const activeGroup = groups[activeGroupIdx]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Story viewer overlay */}
      {viewerOpen && activeGroup && (
        <StoryViewer
          user={activeGroup.user as ApiUser}
          stories={activeGroup.stories}
          onClose={() => setViewerOpen(false)}
          onNextUser={goToNextUser}
          onPrevUser={goToPrevUser}
          hasNextUser={activeGroupIdx < groups.length - 1}
          hasPrevUser={activeGroupIdx > 0}
        />
      )}

      {/* Add story modal */}
      {addOpen && (
        <AddStoryModal
          onClose={() => setAddOpen(false)}
          onSuccess={fetchStories}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]">Stories</h1>
            <p className="text-sm text-[#6B7280]">View and share stories</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Story
          </button>
        </div>

        {/* Empty state */}
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-[#DBEAFE] flex items-center justify-center">
              <Camera className="w-10 h-10 text-[#2563EB]" />
            </div>
            <h2 className="text-lg font-bold text-[#1F2937]">No stories yet</h2>
            <p className="text-sm text-[#6B7280] text-center max-w-xs">
              When your contacts share stories, they&apos;ll appear here. Tap the button above to share yours.
            </p>
          </div>
        )}

        {/* My Story section */}
        {groups.length > 0 && (
          <>
            {/* My Story row */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">My Story</p>
              <div
                onClick={() => {
                  if (myStoryCount > 0) {
                    const idx = groups.findIndex((g) => (g.user as ApiUser)._id === myId)
                    if (idx !== -1) openViewer(idx)
                  } else {
                    setAddOpen(true)
                  }
                }}
                className="inline-flex flex-col items-center gap-2 cursor-pointer group"
              >
                <StoryRing hasStories={myStoryCount > 0} isOwnStory>
                  <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] flex items-center justify-center overflow-hidden border-2 border-white">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Camera className="w-7 h-7 text-[#2563EB]" />
                    )}
                  </div>
                </StoryRing>
                <span className="text-xs font-medium text-[#1F2937]">
                  {myStoryCount > 0 ? 'My Story' : 'Add Story'}
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  {myStoryCount > 0 ? `${myStoryCount} story` : 'Tap to add'}
                </span>
              </div>
            </div>

            {/* Other users' stories */}
            {otherGroups.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] mb-3">Recent Stories</p>
                <div className="grid grid-cols-3 gap-4">
                  {otherGroups.map((group, i) => {
                    const u = group.user as ApiUser
                    const realIdx = groups.findIndex((g) => (g.user as ApiUser)._id === u._id)
                    const firstStory = group.stories[0]
                    return (
                      <motion.div
                        key={u._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => openViewer(realIdx)}
                        className="cursor-pointer group"
                      >
                        <div
                          className="relative aspect-[9/16] rounded-[25px] overflow-hidden mb-2 bg-[#DBEAFE]"
                        >
                          {firstStory && (
                            <img
                              src={firstStory.mediaUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <StoryRing hasStories={true}>
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold">
                                    {u.displayName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </StoryRing>
                          </div>
                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="text-xs font-semibold text-white truncate">{u.displayName}</p>
                            <p className="text-[10px] text-white/70">{group.stories.length} story</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {otherGroups.length === 0 && myStoryCount > 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-sm text-[#6B7280]">Only your stories here.</p>
                <p className="text-xs text-[#9CA3AF]">Share more to get your contacts posting.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
