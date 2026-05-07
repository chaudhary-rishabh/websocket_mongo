'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MessageSquare, X, Trash2, SquarePen, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Eye } from 'lucide-react'
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
  const [hiddenIds,    setHiddenIds]    = useState<Set<string>>(new Set())

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

  const hideSelected = () => {
    setHiddenIds((prev) => new Set([...prev, ...selectedIds]))
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }

  const unHideConv = (id: string) =>
    setHiddenIds((prev) => { const next = new Set(prev); next.delete(id); return next })

  const deleteHiddenConv = (id: string) => {
    setHiddenIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    setDeletedIds((prev) => new Set([...prev, id]))
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
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        <ConversationList
          activeTab={activeTab}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          deletedIds={deletedIds}
          hiddenIds={hiddenIds}
          onToggleSelect={toggleSelect}
          onUnhideConv={unHideConv}
          onDeleteHiddenConv={deleteHiddenConv}
        />
      </div>

      {/* ── Select mode action bar OR bottom nav ── */}
      <AnimatePresence mode="wait">
        {isSelectMode ? (
          <motion.div
            key="select-bar"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="flex-shrink-0 border-t border-[#E0D5C5] px-4 py-3 bg-[#F6EEE3] rounded-b-[25px] flex items-center gap-3"
          >
            <span className="flex-1 text-sm text-[#9A8474]">
              {selectedIds.size === 0 ? 'Tap to select' : `${selectedIds.size} chat${selectedIds.size > 1 ? 's' : ''} selected`}
            </span>
            <button
              onClick={hideSelected}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 bg-[#7C5C3E] hover:bg-[#9B7653] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
            >
              <Eye className="w-3.5 h-3.5" />
              Hide
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="bottom-nav"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="flex-shrink-0 border-t border-[#E0D5C5] px-4 py-3 flex items-center justify-between rounded-b-[25px]"
          >
            {/* Left: Settings */}
            <Link
              href="/profile"
              className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-[#EDE4D6] transition-all duration-200"
              title="Settings"
            >
              <div className="w-8 h-8 rounded-xl bg-[#EDE4D6] group-hover:bg-[#E4D5C2] flex items-center justify-center transition-colors duration-200">
                <Settings className="w-4 h-4 text-[#7C5C3E]" />
              </div>
              <span className="text-xs font-medium text-[#9A8474] group-hover:text-[#7C5C3E] transition-colors duration-200">
                Settings
              </span>
            </Link>

            {/* Right: Logout */}
            <button
              className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-red-50 transition-all duration-200"
              title="Log out"
            >
              <div className="w-8 h-8 rounded-xl bg-[#EDE4D6] group-hover:bg-red-100 flex items-center justify-center transition-colors duration-200">
                <LogOut className="w-4 h-4 text-[#9A8474] group-hover:text-red-500 transition-colors duration-200" />
              </div>
              <span className="text-xs font-medium text-[#9A8474] group-hover:text-red-500 transition-colors duration-200">
                Log out
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Modern collapse toggle ────────────────────────────────────────────── */
function CollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      animate={{ x: collapsed ? -6 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className="hidden md:flex flex-shrink-0 self-center z-10 flex-col items-center justify-center gap-[3px] group"
      style={{ width: 20, height: 40 }}
    >
      {/* Track */}
      <div className="relative w-5 h-10 rounded-full bg-[#EDE4D6] border border-[#D4C4B0] shadow-[0_2px_8px_rgba(124,92,62,0.15)] group-hover:shadow-[0_2px_12px_rgba(124,92,62,0.25)] group-hover:bg-[#E4D5C2] group-hover:border-[#C4A882] transition-all duration-200 flex items-center justify-center overflow-hidden">
        {/* Animated icon */}
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {collapsed
            ? <PanelLeftOpen  className="w-3 h-3 text-[#7C5C3E]" />
            : <PanelLeftClose className="w-3 h-3 text-[#9A8474] group-hover:text-[#7C5C3E] transition-colors duration-200" />
          }
        </motion.div>
        {/* Shimmer line */}
        <div className="absolute inset-x-0 top-1.5 mx-auto w-3 h-px bg-[#C4B4A0]/40 rounded-full" />
        <div className="absolute inset-x-0 bottom-1.5 mx-auto w-3 h-px bg-[#C4B4A0]/40 rounded-full" />
      </div>
    </motion.button>
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

      {/* Modern collapse toggle between panels */}
      <CollapseToggle
        collapsed={desktopCollapsed}
        onToggle={() => setDesktopCollapsed((v) => !v)}
      />

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
