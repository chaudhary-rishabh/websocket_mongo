'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useChatStore } from '@/lib/store'
import { CONVERSATIONS } from '@/lib/mock-data'
import Avatar from '@/components/ui/Avatar'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ApiUser {
  _id: string
  username: string
  displayName: string
  avatar?: string
  isOnline: boolean
  lastSeen?: string
}

type Tab = 'people' | 'groups'

export default function SearchModal() {
  const { isSearchOpen, setSearchOpen, setActiveConversationId, setRealConversations, realConversations } = useChatStore()
  const { data: session } = useSession()
  const [tab, setTab] = useState<Tab>('people')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setResults([])
      setTab('people')
    }
  }, [isSearchOpen])

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim() || !session?.accessToken) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/users/search?q=${encodeURIComponent(q.trim())}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data?.items)) {
        setResults(json.data.items as ApiUser[])
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [session?.accessToken])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchUsers(q), 300)
  }

  const handleSelectPerson = async (user: ApiUser) => {
    if (!session?.accessToken) return
    setStarting(user._id)
    try {
      const res = await fetch(`${API}/api/v1/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ type: 'dm', members: [user._id] }),
      })
      const json = await res.json()
      if (json.success && json.data?._id) {
        const convId: string = json.data._id
        // Refresh real conversations in store
        const listRes = await fetch(`${API}/api/v1/conversations`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
        const listJson = await listRes.json()
        if (listJson.success && Array.isArray(listJson.data)) {
          setRealConversations(listJson.data)
        }
        setActiveConversationId(convId)
        router.push(`/chat/${convId}`)
      }
    } finally {
      setStarting(null)
      setSearchOpen(false)
    }
  }

  // Groups remain mock for now
  const filteredGroups = CONVERSATIONS.filter(
    (c) => c.type === 'group' && c.name.toLowerCase().includes(query.toLowerCase()),
  )

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
                {loading
                  ? <Loader2 className="w-4 h-4 text-[#9A8474] flex-shrink-0 animate-spin" />
                  : <Search className="w-4 h-4 text-[#9A8474] flex-shrink-0" />}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by name or @username…"
                  value={query}
                  onChange={handleQueryChange}
                  className="flex-1 bg-transparent text-sm text-[#2A1F14] placeholder-[#B0A090] outline-none"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults([]) }} className="text-[#C4B4A0] hover:text-[#9A8474]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
              {tab === 'people' && (
                <>
                  {!query && (
                    <p className="text-center text-sm text-[#B0A090] mt-8 px-4">
                      Type a name or @username to find people
                    </p>
                  )}
                  {query && !loading && results.length === 0 && (
                    <p className="text-center text-sm text-[#B0A090] mt-8">No people found</p>
                  )}
                  {results.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectPerson(user)}
                      disabled={starting === user._id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#EDE4D6] transition-colors disabled:opacity-60"
                    >
                      <Avatar
                        src={user.avatar}
                        initials={user.displayName.slice(0, 2).toUpperCase()}
                        name={user.displayName}
                        id={user._id}
                        size="md"
                        isOnline={user.isOnline}
                      />
                      <div className="min-w-0 text-left flex-1">
                        <p className="text-sm font-semibold text-[#2A1F14] truncate">{user.displayName}</p>
                        <p className="text-xs text-[#9A8474] truncate">@{user.username}</p>
                      </div>
                      {starting === user._id && (
                        <Loader2 className="w-4 h-4 text-[#9B7653] animate-spin flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}

              {tab === 'groups' &&
                (filteredGroups.length === 0 ? (
                  <p className="text-center text-sm text-[#B0A090] mt-8">No groups found</p>
                ) : (
                  filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveConversationId(group.id)
                        router.push(`/chat/${group.id}`)
                        setSearchOpen(false)
                      }}
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
