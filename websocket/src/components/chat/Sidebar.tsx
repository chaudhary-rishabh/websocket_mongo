'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MessageCircle, X, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react'
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

function SidebarContent({
  onClose,
  showClose = false,
}: {
  onClose?: () => void
  showClose?: boolean
}) {
  const { setSearchOpen } = useChatStore()

  // ── Selection state ────────────────────────────────────────────────
  const [isSelectMode, setIsSelectMode]   = useState(false)
  const [selectedIds,  setSelectedIds]    = useState<Set<string>>(new Set())
  const [deletedIds,   setDeletedIds]     = useState<Set<string>>(new Set())

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
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        {isSelectMode ? (
          /* Select mode header */
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-semibold text-[#1A1A2E]">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select chats'}
            </span>
          </div>
        ) : (
          /* Normal header */
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6C63FF] flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[#1A1A2E]">ChatApp</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* Select / Cancel toggle */}
          {isSelectMode ? (
            <button
              onClick={cancelSelect}
              className="text-xs font-semibold text-[#6C63FF] px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setIsSelectMode(true)}
              className="text-xs font-semibold text-gray-500 hover:text-[#6C63FF] px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Select
            </button>
          )}

          {showClose && !isSelectMode && (
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}

          {!isSelectMode && (
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
          )}
        </div>
      </div>

      {/* ── Search bar (hidden in select mode) ── */}
      {!isSelectMode && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 rounded-full px-3 py-2"
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-400">Search conversations…</span>
          </button>
        </div>
      )}

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto chat-scrollbar pb-4">
        <ConversationList
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
            className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white flex items-center gap-3"
          >
            <span className="flex-1 text-sm text-gray-500">
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
      {/* Desktop */}
      <motion.aside
        animate={{ width: desktopCollapsed ? 0 : 300 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
        className="hidden md:block flex-shrink-0 h-full overflow-hidden border-r border-gray-100"
        style={{ minWidth: 0 }}
      >
        <div className="w-[300px] h-full">
          <SidebarContent />
        </div>
      </motion.aside>

      {/* Desktop collapse toggle */}
      <motion.button
        animate={{ left: desktopCollapsed ? 8 : 308 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
        onClick={() => setDesktopCollapsed((v) => !v)}
        className="hidden md:flex fixed top-5 z-20 w-7 h-7 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-indigo-50 hover:border-[#6C63FF] transition-colors duration-200"
      >
        {desktopCollapsed
          ? <PanelLeftOpen  className="w-3.5 h-3.5 text-[#6C63FF]" />
          : <PanelLeftClose className="w-3.5 h-3.5 text-gray-400"  />
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
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              variants={drawerVariants}
              initial="hidden" animate="visible" exit="hidden"
              className="fixed left-0 top-0 h-full w-[300px] z-40 md:hidden shadow-2xl will-change-transform"
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
