'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Loader2, Users, ArrowLeft, Check, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useChatStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import { useRouter } from 'next/navigation'
import { useSearchUsers, useCreateDM, useCreateGroup } from '@/hooks/queries'

interface ApiUser {
  _id: string
  username: string
  displayName: string
  avatar?: string
  isOnline: boolean
}

type View = 'search' | 'create-group'
type Tab = 'people' | 'groups'

export default function SearchModal() {
  const { isSearchOpen, setSearchOpen, setActiveConversationId, realConversations } = useChatStore()
  const { data: session } = useSession()
  const router = useRouter()

  const [view, setView]             = useState<View>('search')
  const [tab, setTab]               = useState<Tab>('people')
  const [query, setQuery]           = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Group creation state
  const [groupName, setGroupName]   = useState('')
  const [selected, setSelected]     = useState<ApiUser[]>([])
  const [createError, setCreateError] = useState('')

  const inputRef      = useRef<HTMLInputElement>(null)
  const groupNameRef  = useRef<HTMLInputElement>(null)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: searchData, isLoading: searchLoading } = useSearchUsers(debouncedQuery)
  const createDM = useCreateDM()
  const createGroup = useCreateGroup()

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const results: ApiUser[] = searchData?.users ?? []

  // Reset on modal open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery(''); setDebouncedQuery(''); setTab('people'); setView('search')
      setGroupName(''); setSelected([]); setCreateError('')
    }
  }, [isSearchOpen])

  useEffect(() => {
    if (view === 'create-group') {
      setQuery(''); setDebouncedQuery('')
      setTimeout(() => groupNameRef.current?.focus(), 80)
    }
  }, [view])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  // ── Start DM ─────────────────────────────────────────────────────────────
  const handleSelectPerson = (user: ApiUser) => {
    createDM.mutate(user._id, {
      onSuccess: (data) => {
        setActiveConversationId(data._id)
        router.push(`/chat/${data._id}`)
        setSearchOpen(false)
      },
    })
  }

  // ── Group member toggle ───────────────────────────────────────────────────
  const toggleMember = (user: ApiUser) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    )
  }

  // ── Create group ─────────────────────────────────────────────────────────
  const handleCreateGroup = () => {
    if (!groupName.trim()) { setCreateError('Group name is required.'); return }
    if (selected.length < 1) { setCreateError('Add at least one member.'); return }
    setCreateError('')
    createGroup.mutate(
      { name: groupName.trim(), members: selected.map((u) => u._id) },
      {
        onSuccess: (data) => {
          setActiveConversationId(data._id)
          router.push(`/chat/${data._id}`)
          setSearchOpen(false)
        },
        onError: (err) => setCreateError(err.message),
      },
    )
  }

  const close = () => setSearchOpen(false)

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, x: -40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed left-3 top-3 bottom-3 w-80 bg-[#EFF6FF] shadow-2xl z-50 flex flex-col border border-[#BFDBFE]"
            style={{ borderRadius: 25 }}
          >
            <AnimatePresence mode="wait">
              {view === 'search' ? (
                <SearchView
                  key="search"
                  tab={tab} setTab={setTab}
                  query={query} onQueryChange={handleQueryChange}
                  results={results} loading={searchLoading} starting={createDM.isPending ? (createDM.variables ?? null) : null}
                  realGroups={realConversations.filter((c) => c.type === 'group')}
                  inputRef={inputRef}
                  onSelectPerson={handleSelectPerson}
                  onClearQuery={() => { setQuery(''); setDebouncedQuery('') }}
                  onNewGroup={() => setView('create-group')}
                  onClose={close}
                  onSelectGroup={(id) => {
                    setActiveConversationId(id)
                    router.push(`/chat/${id}`)
                    setSearchOpen(false)
                  }}
                />
              ) : (
                <CreateGroupView
                  key="create-group"
                  groupName={groupName} onGroupNameChange={setGroupName}
                  groupNameRef={groupNameRef}
                  query={query} onQueryChange={handleQueryChange}
                  results={results} loading={searchLoading}
                  selected={selected} onToggleMember={toggleMember}
                  creating={createGroup.isPending} createError={createError}
                  inputRef={inputRef}
                  onBack={() => { setView('search'); setSelected([]); setGroupName('') }}
                  onCreateGroup={handleCreateGroup}
                  onClearQuery={() => { setQuery(''); setDebouncedQuery('') }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ─── Search view ─────────────────────────────────────────────────────────── */
function SearchView({
  tab, setTab, query, onQueryChange, results, loading, starting, realGroups, inputRef,
  onSelectPerson, onClearQuery, onNewGroup, onClose, onSelectGroup,
}: {
  tab: Tab; setTab: (t: Tab) => void
  query: string; onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  results: ApiUser[]; loading: boolean; starting: string | null
  realGroups: { _id: string; name?: string; members: { _id: string; displayName: string; isOnline: boolean }[] }[]
  inputRef: React.RefObject<HTMLInputElement | null>
  onSelectPerson: (u: ApiUser) => void
  onClearQuery: () => void
  onNewGroup: () => void
  onClose: () => void
  onSelectGroup: (id: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <h2 className="flex-1 text-lg font-bold text-[#1F2937]">Search</h2>
        <button
          onClick={onNewGroup}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#DBEAFE] hover:bg-[#BFDBFE] px-2.5 py-1.5 rounded-xl transition-colors"
          title="Create group"
        >
          <Users className="w-3.5 h-3.5" />
          New Group
        </button>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#DBEAFE] transition-colors text-[#6B7280]">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-white/70 border border-[#BFDBFE] rounded-2xl px-4 py-2.5">
          {loading
            ? <Loader2 className="w-4 h-4 text-[#6B7280] flex-shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-[#6B7280] flex-shrink-0" />}
          <input
            ref={inputRef} type="text"
            placeholder="Search by name or @username…"
            value={query} onChange={onQueryChange}
            className="flex-1 bg-transparent text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none"
          />
          {query && (
            <button onClick={onClearQuery} className="text-[#93C5FD] hover:text-[#6B7280]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mb-2">
        <div className="flex items-center bg-[#DBEAFE] rounded-2xl p-1 gap-1 w-full">
          {(['people', 'groups'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-xl capitalize transition-all duration-200 ${
                tab === t ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#6B7280] hover:text-[#2563EB]'
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto chat-scrollbar py-2">
        {tab === 'people' && (
          <>
            {loading && results.length === 0 && (
              <div className="flex justify-center mt-8">
                <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
              </div>
            )}
            {!loading && results.length === 0 && (
              <p className="text-center text-sm text-[#9CA3AF] mt-8">
                {query ? 'No people found' : 'No other users yet'}
              </p>
            )}
            {results.map((user) => (
              <button key={user._id} onClick={() => onSelectPerson(user)} disabled={starting === user._id}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#DBEAFE] transition-colors disabled:opacity-60"
              >
                <Avatar src={user.avatar} initials={user.displayName.slice(0, 2).toUpperCase()}
                  name={user.displayName} id={user._id} size="md" isOnline={user.isOnline} />
                <div className="min-w-0 text-left flex-1">
                  <p className="text-sm font-semibold text-[#1F2937] truncate">{user.displayName}</p>
                  <p className="text-xs text-[#6B7280]">@{user.username}</p>
                </div>
                {starting === user._id
                  ? <Loader2 className="w-4 h-4 text-[#3B82F6] animate-spin flex-shrink-0" />
                  : <Plus className="w-4 h-4 text-[#93C5FD] flex-shrink-0 opacity-0 group-hover:opacity-100" />}
              </button>
            ))}
          </>
        )}

        {tab === 'groups' && (
          <>
            {/* Create group button always visible at top */}
            <div className="px-3 pb-2">
              <button
                onClick={onNewGroup}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 border border-[#2563EB]/20 rounded-2xl transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#2563EB]">Create a Group</p>
                  <p className="text-xs text-[#6B7280]">Add members and start chatting</p>
                </div>
              </button>
            </div>

            {/* Divider + label */}
            {realGroups.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] px-4 pt-1 pb-1">
                Your Groups
              </p>
            )}

            {/* Real groups */}
            {realGroups
              .filter((g) => !query || (g.name ?? '').toLowerCase().includes(query.toLowerCase()))
              .map((group) => {
                const name = group.name ?? 'Group'
                const onlineCount = group.members.filter((m) => m.isOnline).length
                return (
                  <button key={group._id} onClick={() => onSelectGroup(group._id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#DBEAFE] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#93C5FD] flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold text-[#1F2937] truncate">{name}</p>
                      <p className="text-xs text-[#6B7280]">
                        {group.members.length} members{onlineCount > 0 ? ` · ${onlineCount} online` : ''}
                      </p>
                    </div>
                  </button>
                )
              })}

            {realGroups.length === 0 && (
              <p className="text-center text-sm text-[#9CA3AF] mt-4 px-4">No groups yet. Create one!</p>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Create Group view ───────────────────────────────────────────────────── */
function CreateGroupView({
  groupName, onGroupNameChange, groupNameRef,
  query, onQueryChange, results, loading,
  selected, onToggleMember,
  creating, createError, inputRef,
  onBack, onCreateGroup, onClearQuery,
}: {
  groupName: string; onGroupNameChange: (v: string) => void
  groupNameRef: React.RefObject<HTMLInputElement | null>
  query: string; onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  results: ApiUser[]; loading: boolean
  selected: ApiUser[]; onToggleMember: (u: ApiUser) => void
  creating: boolean; createError: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onBack: () => void; onCreateGroup: () => void
  onClearQuery: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-[#DBEAFE] transition-colors text-[#6B7280]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="flex-1 text-base font-bold text-[#1F2937]">New Group</h2>
        <button
          onClick={onCreateGroup}
          disabled={creating || !groupName.trim() || selected.length < 1}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl transition-colors"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Create
        </button>
      </div>

      {/* Group name input */}
      <div className="px-4 pb-3">
        <input
          ref={groupNameRef}
          type="text"
          placeholder="Group name…"
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          maxLength={80}
          className="w-full bg-white border border-[#BFDBFE] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none transition-all"
        />
        {createError && <p className="text-xs text-red-400 mt-1 px-1">{createError}</p>}
      </div>

      {/* Selected members */}
      {selected.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {selected.map((u) => (
            <button
              key={u._id}
              onClick={() => onToggleMember(u)}
              className="flex items-center gap-1.5 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 border border-[#2563EB]/20 text-[#2563EB] text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
            >
              <span>{u.displayName}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Member count hint */}
      <p className="text-[11px] text-[#6B7280] px-4 mb-2">
        {selected.length === 0
          ? 'Search and add members below'
          : `${selected.length} member${selected.length > 1 ? 's' : ''} added`}
      </p>

      {/* Search members */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-white/70 border border-[#BFDBFE] rounded-2xl px-4 py-2.5">
          {loading
            ? <Loader2 className="w-4 h-4 text-[#6B7280] flex-shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-[#6B7280] flex-shrink-0" />}
          <input
            ref={inputRef} type="text"
            placeholder="Search people to add…"
            value={query} onChange={onQueryChange}
            className="flex-1 bg-transparent text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none"
          />
          {query && (
            <button onClick={onClearQuery} className="text-[#93C5FD] hover:text-[#6B7280]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto chat-scrollbar py-1">
        {!query && (
          <p className="text-center text-sm text-[#9CA3AF] mt-6">Search to add people</p>
        )}
        {query && !loading && results.length === 0 && (
          <p className="text-center text-sm text-[#9CA3AF] mt-6">No people found</p>
        )}
        {results.map((user) => {
          const isSelected = selected.some((u) => u._id === user._id)
          return (
            <button key={user._id} onClick={() => onToggleMember(user)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                isSelected ? 'bg-[#DBEAFE]' : 'hover:bg-[#DBEAFE]/60'
              }`}
            >
              <Avatar src={user.avatar} initials={user.displayName.slice(0, 2).toUpperCase()}
                name={user.displayName} id={user._id} size="md" isOnline={user.isOnline} />
              <div className="min-w-0 text-left flex-1">
                <p className="text-sm font-semibold text-[#1F2937] truncate">{user.displayName}</p>
                <p className="text-xs text-[#6B7280]">@{user.username}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                isSelected ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#93C5FD]'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
