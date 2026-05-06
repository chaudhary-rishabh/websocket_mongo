import { create } from 'zustand'

interface ChatStore {
  activeConversationId: string | null
  setActiveConversationId: (id: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  activeConversationId: 'conv-1',
  setActiveConversationId: (id) =>
    set({ activeConversationId: id, isSidebarOpen: false }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  isSearchOpen: false,
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}))
