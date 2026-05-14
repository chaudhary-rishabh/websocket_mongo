'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, UserPlus, LogOut, UserMinus, Search, Check, Loader2 } from 'lucide-react'
import type { Conversation } from '@/lib/schemas'
import type { PopulatedMember } from '@/lib/chat-types'
import { getUserById } from '@/lib/mock-data'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/store'
import { useSearchUsers, useAddMembers, useRemoveMember, useLeaveGroup } from '@/hooks/queries'

const REAL_ID = /^[0-9a-f]{24}$/i

interface SearchUser {
  _id: string
  displayName: string
  username: string
  avatar?: string
  isOnline: boolean
}

interface GroupMembersModalProps {
  conversation: Conversation
  memberDetails?: PopulatedMember[]
  myUserId?: string
  onClose: () => void
}

export default function GroupMembersModal({
  conversation,
  memberDetails,
  myUserId,
  onClose,
}: GroupMembersModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { realConversations } = useChatStore()
  const isReal = REAL_ID.test(conversation.id)

  // Build initial member list — real populated data or mock fallback
  const initialMembers: PopulatedMember[] = memberDetails
    ?? conversation.members
         .map((id) => getUserById(id))
         .filter((m): m is NonNullable<typeof m> => Boolean(m))
         .map((m) => ({
           id: m.id,
           name: m.name,
           avatar: m.avatar,
           initials: m.initials,
           isOnline: m.isOnline,
           isAdmin: m.role === 'admin',
           isMe: m.id === myUserId,
         }))

  const [members, setMembers]         = useState<PopulatedMember[]>(initialMembers)
  const [view, setView]               = useState<'list' | 'add'>('list')
  const [searchQ, setSearchQ]         = useState('')
  const [debouncedQ, setDebouncedQ]   = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const onlineMembers  = members.filter((m) =>  m.isOnline)
  const offlineMembers = members.filter((m) => !m.isOnline)
  const amIAdmin       = members.find((m) => m.isMe)?.isAdmin ?? false

  const { data: searchData } = useSearchUsers(debouncedQ)
  const addMembers = useAddMembers()
  const removeMember = useRemoveMember()
  const leaveGroup = useLeaveGroup()

  useEffect(() => {
    if (view !== 'add') return
    const t = setTimeout(() => setDebouncedQ(searchQ), 300)
    return () => clearTimeout(t)
  }, [searchQ, view])

  const existingIds = new Set(members.map((m) => m.id))
  const searchResults: SearchUser[] = (searchData?.users ?? []).filter((u: SearchUser) => !existingIds.has(u._id))

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleLeave = () => {
    if (!isReal) return
    leaveGroup.mutate(conversation.id, {
      onSuccess: () => {
        onClose()
        router.push('/chat')
      },
    })
  }

  const handleRemove = (memberId: string) => {
    if (!isReal) return
    removeMember.mutate({ convId: conversation.id, memberId }, {
      onSuccess: () => {
        setMembers((prev) => prev.filter((m) => m.id !== memberId))
      },
    })
  }

  const handleAddMembers = () => {
    if (selectedIds.size === 0) return
    addMembers.mutate({ convId: conversation.id, userIds: [...selectedIds] }, {
      onSuccess: () => {
        const added: PopulatedMember[] = searchResults
          .filter((u) => selectedIds.has(u._id))
          .map((u) => ({
            id: u._id,
            name: u.displayName,
            avatar: u.avatar,
            initials: u.displayName.slice(0, 2).toUpperCase(),
            isOnline: u.isOnline,
            isAdmin: false,
            isMe: false,
          }))
        setMembers((prev) => [...prev, ...added])
        setSelectedIds(new Set())
        setView('list')
      },
    })
  }

  const closeAdd = () => { setView('list'); setSelectedIds(new Set()); setSearchQ(''); setDebouncedQ('') }

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="members-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/30"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          key="members-panel"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
          <div
            className="pointer-events-auto bg-[#EFF6FF] w-full max-w-sm flex flex-col shadow-2xl overflow-hidden border border-[#BFDBFE]"
            style={{ borderRadius: 25, maxHeight: '80vh' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
              <div>
                {view === 'add' ? (
                  <h2 className="text-base font-bold text-[#1F2937]">Add Members</h2>
                ) : (
                  <>
                    <h2 className="text-base font-bold text-[#1F2937]">{conversation.name}</h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {members.length} members · {onlineMembers.length} online
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={view === 'add' ? closeAdd : onClose}
                className="p-2 rounded-full hover:bg-[#DBEAFE] transition-colors text-[#6B7280]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Action buttons (list view only) ── */}
            {view === 'list' && (
              <>
                <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
                  {isReal && amIAdmin && (
                    <button
                      onClick={() => { setView('add'); setSearchQ('') }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors duration-200"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Member
                    </button>
                  )}
                  {isReal && (
                    <button
                      onClick={handleLeave}
                      disabled={leaveGroup.isPending}
                      className="flex-1 flex items-center justify-center gap-2 border border-red-300/60 hover:bg-red-50 text-red-500 text-xs font-semibold py-2.5 rounded-xl transition-colors duration-200 disabled:opacity-50"
                    >
                      {leaveGroup.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <LogOut className="w-3.5 h-3.5" />}
                      {leaveGroup.isPending ? 'Leaving…' : 'Leave Group'}
                    </button>
                  )}
                </div>
                <div className="h-px bg-[#BFDBFE] mx-5 flex-shrink-0" />
              </>
            )}

            {/* ── Add member search ── */}
            {view === 'add' && (
              <>
                <div className="px-5 pb-3 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-white/60 border border-[#BFDBFE] rounded-2xl px-3 py-2">
                    <Search className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                    <input
                      autoFocus
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="Search by name or username…"
                      className="flex-1 text-sm bg-transparent outline-none text-[#1F2937] placeholder-[#9CA3AF]"
                    />
                  </div>
                </div>

                {selectedIds.size > 0 && (
                  <div className="px-5 pb-3 flex-shrink-0">
                    <button
                      onClick={handleAddMembers}
                      disabled={addMembers.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      {addMembers.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <UserPlus className="w-3.5 h-3.5" />}
                      Add {selectedIds.size} member{selectedIds.size > 1 ? 's' : ''}
                    </button>
                  </div>
                )}

                <div className="h-px bg-[#BFDBFE] mx-5 flex-shrink-0" />
              </>
            )}

            {/* ── List body ── */}
            <div className="overflow-y-auto chat-scrollbar flex-1 py-3">

              {/* Add-member search results */}
              {view === 'add' && (
                searchResults.length === 0 ? (
                  <p className="text-center text-xs text-[#9CA3AF] py-8">
                    {searchQ ? 'No users found' : 'Start typing to search users'}
                  </p>
                ) : (
                  searchResults.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => toggleSelect(u._id)}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#DBEAFE] cursor-pointer transition-colors"
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        selectedIds.has(u._id)
                          ? 'bg-[#2563EB] border-[#2563EB]'
                          : 'border-[#93C5FD] bg-white',
                      )}>
                        {selectedIds.has(u._id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <Avatar
                        src={u.avatar}
                        initials={u.displayName.slice(0, 2).toUpperCase()}
                        name={u.displayName}
                        id={u._id}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1F2937] truncate">{u.displayName}</p>
                        <p className="text-xs text-[#6B7280]">@{u.username}</p>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* Member list */}
              {view === 'list' && (
                <>
                  {onlineMembers.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] px-5 pb-2">
                        Online — {onlineMembers.length}
                      </p>
                      {onlineMembers.map((m) => (
                        <MemberRow
                          key={m.id}
                          member={m}
                          canRemove={isReal && amIAdmin && !m.isMe}
                          onRemove={() => handleRemove(m.id)}
                        />
                      ))}
                    </>
                  )}
                  {offlineMembers.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7280] px-5 pt-3 pb-2">
                        Offline — {offlineMembers.length}
                      </p>
                      {offlineMembers.map((m) => (
                        <MemberRow
                          key={m.id}
                          member={m}
                          canRemove={isReal && amIAdmin && !m.isMe}
                          onRemove={() => handleRemove(m.id)}
                        />
                      ))}
                    </>
                  )}
                  {members.length === 0 && (
                    <p className="text-center text-xs text-[#9CA3AF] py-8">No members to show</p>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

function MemberRow({
  member,
  canRemove,
  onRemove,
}: {
  member: PopulatedMember
  canRemove: boolean
  onRemove: () => void
}) {
  return (
    <div className="group flex items-center gap-3 px-5 py-2.5 hover:bg-[#DBEAFE] transition-colors">
      <div className="relative flex-shrink-0">
        <Avatar src={member.avatar} initials={member.initials} name={member.name} id={member.id} size="md" />
        <span className={cn(
          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#EFF6FF]',
          member.isOnline ? 'bg-[#22C55E]' : 'bg-[#93C5FD]',
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            'text-sm font-medium truncate',
            member.isMe ? 'text-[#2563EB]' : 'text-[#1F2937]',
          )}>
            {member.isMe ? `${member.name} (You)` : member.name}
          </p>
          {member.isAdmin && (
            <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" />
          )}
        </div>
        <p className="text-xs mt-0.5">
          {member.isOnline
            ? <span className="text-emerald-600 font-medium">Online</span>
            : <span className="text-[#9CA3AF]">Offline</span>}
        </p>
      </div>

      {canRemove && (
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
          title="Remove from group"
        >
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
