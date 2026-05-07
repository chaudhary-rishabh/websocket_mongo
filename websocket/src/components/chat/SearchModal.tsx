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
    (c) => c.type === 'group' && c.name.toLowerCase().includes(query.toLowerCase()),
  )

  const handleSelectPerson = (userId: string) => {
    const conv = CONVERSATIONS.find((c) => c.type === 'direct' && c.members.includes(userId))
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
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSearchOpen(false)}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, x: -40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed left-3 top-3 bottom-3 w-80 bg-[#F6EEE3] shadow-2xl z-50 flex flex-col border border-[#E0D5C5]"
            style={{ borderRadius: 25 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <h2 className="flex-1 text-lg font-bold text-[#2A1F14]">Search</h2>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 bg-white/70 border border-[#E0D5C5] rounded-2xl px-4 py-2.5">
                <Search className="w-4 h-4 text-[#9A8474] flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search people or groups…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#2A1F14] placeholder-[#B0A090] outline-none"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex px-4 mb-2">
              <div className="flex items-center bg-[#EDE4D6] rounded-2xl p-1 gap-1 w-full">
                {(['people', 'groups'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-xl capitalize transition-all duration-200 ${
                      tab === t
                        ? 'bg-white text-[#7C5C3E] shadow-sm'
                        : 'text-[#9A8474] hover:text-[#7C5C3E]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto chat-scrollbar py-2">
              {tab === 'people' &&
                (filteredPeople.length === 0 ? (
                  <p className="text-center text-sm text-[#B0A090] mt-8">No people found</p>
                ) : (
                  filteredPeople.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectPerson(user.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#EDE4D6] transition-colors"
                    >
                      <Avatar src={user.avatar} initials={user.initials} name={user.name} id={user.id} size="md" isOnline={user.isOnline} />
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-[#2A1F14] truncate">{user.name}</p>
                        <p className="text-xs text-[#9A8474]">
                          {user.isOnline ? 'Online' : `Last seen ${formatTime(user.lastSeen)} ago`}
                        </p>
                      </div>
                    </button>
                  ))
                ))}

              {tab === 'groups' &&
                (filteredGroups.length === 0 ? (
                  <p className="text-center text-sm text-[#B0A090] mt-8">No groups found</p>
                ) : (
                  filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleSelectGroup(group.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#EDE4D6] transition-colors"
                    >
                      <Avatar initials={group.initials} name={group.name} id={group.id} size="md" />
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-[#2A1F14] truncate">{group.name}</p>
                        <p className="text-xs text-[#9A8474]">
                          {group.members.length} members{group.onlineCount ? ` · ${group.onlineCount} online` : ''}
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
