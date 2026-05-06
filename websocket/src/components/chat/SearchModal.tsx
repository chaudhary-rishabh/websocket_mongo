'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useChatStore } from '@/lib/store'
import { USERS, CONVERSATIONS } from '@/lib/mock-data'
import Avatar from '@/components/ui/Avatar'
import { formatTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type Tab = 'people' | 'groups'

export default function SearchModal() {
  const { isSearchOpen, setSearchOpen, setActiveConversationId } = useChatStore()
  const [tab, setTab] = useState<Tab>('people')
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setTab('people')
    }
  }, [isSearchOpen])

  const filteredPeople = USERS.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()),
  )

  const filteredGroups = CONVERSATIONS.filter(
    (c) =>
      c.type === 'group' &&
      c.name.toLowerCase().includes(query.toLowerCase()),
  )

  const handleSelectPerson = (userId: string) => {
    const conv = CONVERSATIONS.find(
      (c) => c.type === 'direct' && c.members.includes(userId),
    )
    if (conv) {
      setActiveConversationId(conv.id)
      router.push(`/chat/${conv.id}`)
    }
    setSearchOpen(false)
  }

  const handleSelectGroup = (convId: string) => {
    setActiveConversationId(convId)
    router.push(`/chat/${convId}`)
    setSearchOpen(false)
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSearchOpen(false)}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, x: -40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
              <h2 className="flex-1 text-lg font-bold text-[#1A1A2E]">Search</h2>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Search input */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search people or groups…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#1A1A2E] placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-4">
              {(['people', 'groups'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 pb-2 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]'
                      : 'text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto chat-scrollbar py-2">
              {tab === 'people' &&
                (filteredPeople.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 mt-8">No people found</p>
                ) : (
                  filteredPeople.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectPerson(user.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors"
                    >
                      <Avatar
                        src={user.avatar}
                        initials={user.initials}
                        name={user.name}
                        id={user.id}
                        size="md"
                        isOnline={user.isOnline}
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.isOnline
                            ? 'Online'
                            : `Last seen ${formatTime(user.lastSeen)} ago`}
                        </p>
                      </div>
                    </button>
                  ))
                ))}

              {tab === 'groups' &&
                (filteredGroups.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 mt-8">No groups found</p>
                ) : (
                  filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleSelectGroup(group.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors"
                    >
                      <Avatar
                        initials={group.initials}
                        name={group.name}
                        id={group.id}
                        size="md"
                      />
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                          {group.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {group.members.length} members
                          {group.onlineCount ? `, ${group.onlineCount} online` : ''}
                        </p>
                      </div>
                    </button>
                  ))
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
