'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MessageSquare, X, Trash2, SquarePen, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Eye, Bot, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/lib/store'
import ConversationList from './ConversationList'
import SearchModal from './SearchModal'
import { logoutAction } from '@/app/actions/auth'

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
  collapsed = false,
  onToggleCollapse,
}: {
  onClose?: () => void
  showClose?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
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
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-xl border border-white/40 rounded-[25px] shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        {isSelectMode ? (
          <span className="text-sm font-semibold text-gray-900">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select chats'}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">ChatApp</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {isSelectMode ? (
            <button
              onClick={cancelSelect}
              className="text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsSelectMode(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                title="Select chats"
              >
                <SquarePen className="w-4 h-4" />
              </button>

              {/* Mobile close drawer button */}
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Desktop collapse button — rightmost, desktop only */}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  title="Collapse sidebar"
                  className="hidden md:flex p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
                >
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </motion.div>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Search bar ── */}
      {!isSelectMode && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-2xl px-4 py-2.5 border border-gray-200"
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-400">Search conversations…</span>
          </button>
        </div>
      )}

      {/* ── People / Groups toggle with smooth sliding indicator ── */}
      {!isSelectMode && (
        <div className="px-4 pb-3">
          <div className="relative flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
            {/* Sliding background pill */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm"
              style={{ width: 'calc(50% - 6px)' }}
              animate={{ x: activeTab === 'people' ? 0 : 'calc(100% + 4px)' }}
              transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
            />
            {(['people', 'groups'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="relative flex-1 text-xs font-semibold py-[10px] rounded-xl z-10 transition-colors duration-200"
                style={{ color: activeTab === t ? '#111827' : '#9CA3AF' }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
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

      {/* ── AI Chat shortcut — pinned above bottom nav ── */}
      {!isSelectMode && (
        <div className="flex-shrink-0 px-3 pb-2">
          <Link
            href="/chat/ai"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 transition-all duration-200 border-2 border-blue-400/50 shadow-[0_0_14px_rgba(96,165,250,0.35)] hover:shadow-[0_0_20px_rgba(96,165,250,0.55)] hover:border-blue-400/70"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">AI Assistant</p>
              <p className="text-[10px] text-white/50">Powered by DeepSeek</p>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          </Link>
        </div>
      )}

      {/* ── Select mode action bar OR bottom nav ── */}
      <AnimatePresence mode="wait">
        {isSelectMode ? (
          <motion.div
            key="select-bar"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="flex-shrink-0 border-t border-gray-200 px-4 py-3 bg-white rounded-b-[25px] flex items-center gap-3"
          >
            <span className="flex-1 text-sm text-gray-500">
              {selectedIds.size === 0 ? 'Tap to select' : `${selectedIds.size} chat${selectedIds.size > 1 ? 's' : ''} selected`}
            </span>
            <button
              onClick={hideSelected}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
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
            className="flex-shrink-0 border-t border-gray-200 px-4 py-3 flex items-center justify-between rounded-b-[25px]"
          >
            <Link
              href="/profile"
              className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-gray-100 transition-all duration-200"
              title="Settings"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors duration-200">
                <Settings className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 group-hover:text-gray-800 transition-colors duration-200">
                Settings
              </span>
            </Link>

            <button
              onClick={() => logoutAction()}
              className="group flex items-center gap-2 p-2 rounded-2xl hover:bg-red-50 transition-all duration-200"
              title="Log out"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors duration-200">
                <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
              </div>
              <span className="text-xs font-medium text-gray-500 group-hover:text-red-500 transition-colors duration-200">
                Log out
              </span>
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
          <SidebarContent
            collapsed={desktopCollapsed}
            onToggleCollapse={() => setDesktopCollapsed((v) => !v)}
          />
        </div>
      </motion.aside>

      {/* Desktop re-open button — only visible when sidebar is collapsed */}
      <AnimatePresence>
        {desktopCollapsed && (
          <motion.button
            key="reopen"
            initial={{ opacity: 0, x: -12, scale: 0.85 }}
            animate={{ opacity: 1, x: 0,   scale: 1 }}
            exit={{    opacity: 0, x: -12, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={() => setDesktopCollapsed(false)}
            title="Open sidebar"
            className="hidden md:flex flex-shrink-0 self-start mt-4 p-2.5 rounded-2xl bg-white/90 backdrop-blur-sm hover:bg-gray-100 transition-colors text-gray-600 shadow-md border border-gray-200 z-20 relative"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

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
