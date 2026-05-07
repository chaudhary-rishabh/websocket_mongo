'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MessageSquare, X, ChevronLeft, ChevronRight, Trash2, SquarePen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/lib/store'
import { CURRENT_USER } from '@/lib/mock-data'
import Avatar from '@/components/ui/Avatar'
import ConversationList from './ConversationList'
import SearchModal from './SearchModal'

const drawerVariants = {
  hidden:  { x: '-100%', transition: { type: 'tween', ease: [0.4, 0, 1, 1], duration: 0.22 } },
  visible: { x: 0,       transition: { type: 'spring', stiffness: 380, damping: 36, mass: 0.8 } },
} as const

const backdropVariants = {
  hidden:  { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
  visible: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
} as const

type Tab = 'people' | 'groups'

function SidebarContent({
  onClose,
  showClose = false,
}: {
  onClose?: () => void
  showClose?: boolean
}) {
  const { setSearchOpen } = useChatStore()

  const [activeTab,    setActiveTab]    = useState<Tab>('people')
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set())
  const [deletedIds,   setDeletedIds]   = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleDelete = () => {
    setDeletedIds((prev) => new Set([...prev, ...selectedIds]))
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }

  const cancelSelect = () => {
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }

  return (
    <div className="flex flex-col h-full bg-[#F6EEE3] rounded-[25px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        {isSelectMode ? (
          <span className="text-sm font-semibold text-[#2A1F14]">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select chats'}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7C5C3E] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[#2A1F14]">ChatApp</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {isSelectMode ? (
            <button
              onClick={cancelSelect}
              className="text-xs font-semibold text-[#7C5C3E] px-2.5 py-1 rounded-xl hover:bg-[#EDE4D6] transition-colors"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsSelectMode(true)}
                className="p-2 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
                title="Select chats"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Link href="/profile" className="rounded-full">
                <Avatar
                  src={CURRENT_USER.avatar}
                  initials={CURRENT_USER.initials}
                  name={CURRENT_USER.name}
                  id={CURRENT_USER.id}
                  size="sm"
                  isOnline
                />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      {!isSelectMode && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 bg-white/60 hover:bg-white/80 transition-colors duration-200 rounded-2xl px-4 py-2.5 border border-[#E0D5C5]"
          >
            <Search className="w-4 h-4 text-[#9A8474] flex-shrink-0" />
            <span className="text-sm text-[#B0A090]">Search conversations…</span>
          </button>
        </div>
      )}

      {/* ── People / Groups toggle ── */}
      {!isSelectMode && (
        <div className="px-4 pb-3">
          <div className="flex items-center bg-[#EDE4D6] rounded-2xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('people')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-xl transition-all duration-200 ${
                activeTab === 'people'
                  ? 'bg-white text-[#7C5C3E] shadow-sm'
                  : 'text-[#9A8474] hover:text-[#7C5C3E]'
              }`}
            >
              People
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-xl transition-all duration-200 ${
                activeTab === 'groups'
                  ? 'bg-white text-[#7C5C3E] shadow-sm'
                  : 'text-[#9A8474] hover:text-[#7C5C3E]'
              }`}
            >
              Groups
            </button>
          </div>
        </div>
      )}

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto chat-scrollbar pb-4">
        <ConversationList
          activeTab={activeTab}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          deletedIds={deletedIds}
          onToggleSelect={toggleSelect}
        />
      </div>

      {/* ── Select mode action bar ── */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="flex-shrink-0 border-t border-[#E0D5C5] px-4 py-3 bg-[#F6EEE3] rounded-b-[25px] flex items-center gap-3"
          >
            <span className="flex-1 text-sm text-[#9A8474]">
              {selectedIds.size === 0 ? 'Tap to select' : `${selectedIds.size} chat${selectedIds.size > 1 ? 's' : ''} selected`}
            </span>
            <button
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Sidebar shell ────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useChatStore()
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: desktopCollapsed ? 0 : 300 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
        className="hidden md:block flex-shrink-0 h-full overflow-hidden"
        style={{ minWidth: 0 }}
      >
        <div className="w-[300px] h-full">
          <SidebarContent />
        </div>
      </motion.aside>

      {/* Desktop collapse toggle — sits between panels */}
      <motion.button
        animate={{ x: desktopCollapsed ? -8 : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
        onClick={() => setDesktopCollapsed((v) => !v)}
        className="hidden md:flex flex-shrink-0 self-center w-6 h-12 items-center justify-center rounded-full bg-[#EDE4D6] hover:bg-[#E4D5C2] border border-[#D4C4B0] shadow-sm transition-colors duration-200 z-10"
        title={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {desktopCollapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-[#7C5C3E]" />
          : <ChevronLeft  className="w-3.5 h-3.5 text-[#9A8474]" />
        }
      </motion.button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              variants={backdropVariants}
              initial="hidden" animate="visible" exit="hidden"
              className="fixed inset-0 bg-black/30 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              variants={drawerVariants}
              initial="hidden" animate="visible" exit="hidden"
              className="fixed left-0 top-0 h-full w-[300px] z-40 md:hidden shadow-2xl will-change-transform p-3"
            >
              <SidebarContent showClose onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchModal />
    </>
  )
}
