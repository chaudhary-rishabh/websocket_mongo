import Sidebar from '@/components/chat/Sidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white p-3 gap-3">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#F6EEE3] rounded-[25px]">
        {children}
      </main>
    </div>
  )
}
