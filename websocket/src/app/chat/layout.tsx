'use client'

import Sidebar from '@/components/chat/Sidebar'
import WSProvider from '@/components/chat/WSProvider'
import OnboardingGate from '@/components/onboarding/OnboardingGate'
import StoryViewer from '@/components/story/StoryViewer'
import { useChatStore } from '@/lib/store'
import type { ApiUser } from '@/lib/chat-types'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { activeStoryGroup, isStoryViewerOpen, setStoryViewerOpen, setActiveStoryGroup } = useChatStore()

  const handleCloseViewer = () => {
    setStoryViewerOpen(false)
    setActiveStoryGroup(null)
  }

  return (
    <div
      className="relative flex h-screen overflow-hidden p-3 gap-3"
      style={{ backgroundImage: "url('/chatbg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Frosted overlay on top of the background image */}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-lg pointer-events-none" />

      <WSProvider />
      <OnboardingGate />
      <Sidebar />
      <main className="relative flex-1 flex flex-col overflow-hidden min-w-0 bg-white/40 backdrop-blur-xl border border-white/40 rounded-[25px] shadow-sm">
        {children}

        {/* Story viewer overlay - renders inside main to keep sidebar visible */}
        {isStoryViewerOpen && activeStoryGroup && (
          <StoryViewer
            user={activeStoryGroup.user as ApiUser}
            stories={activeStoryGroup.stories}
            onClose={handleCloseViewer}
            onNextUser={handleCloseViewer}
            onPrevUser={undefined}
            hasNextUser={false}
            hasPrevUser={false}
          />
        )}
      </main>
    </div>
  )
}
