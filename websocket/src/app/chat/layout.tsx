import Sidebar from '@/components/chat/Sidebar'
import WSProvider from '@/components/chat/WSProvider'
import OnboardingGate from '@/components/onboarding/OnboardingGate'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
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
      </main>
    </div>
  )
}
