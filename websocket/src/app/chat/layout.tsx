import Sidebar from '@/components/chat/Sidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F2FF]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}
