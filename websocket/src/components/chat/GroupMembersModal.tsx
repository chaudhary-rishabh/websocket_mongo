'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, UserPlus, LogOut } from 'lucide-react'
import type { Conversation } from '@/lib/schemas'
import { getUserById } from '@/lib/mock-data'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface GroupMembersModalProps {
  conversation: Conversation
  onClose: () => void
}

type Member = NonNullable<ReturnType<typeof getUserById>>

export default function GroupMembersModal({ conversation, onClose }: GroupMembersModalProps) {
  const members = conversation.members
    .map((id) => getUserById(id))
    .filter((m): m is Member => Boolean(m))
    .sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1
      if (a.role !== 'admin' && b.role === 'admin') return 1
      if (a.isOnline && !b.isOnline) return -1
      if (!a.isOnline && b.isOnline) return 1
      return a.name.localeCompare(b.name)
    })

  const onlineCount    = members.filter((m) =>  m.isOnline).length
  const onlineMembers  = members.filter((m) =>  m.isOnline)
  const offlineMembers = members.filter((m) => !m.isOnline)

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

        {/* Centered modal */}
        <motion.div
          key="members-panel"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
          <div
            className="pointer-events-auto bg-[#F6EEE3] w-full max-w-sm flex flex-col shadow-2xl overflow-hidden border border-[#E0D5C5]"
            style={{ borderRadius: 25, maxHeight: '80vh' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-[#2A1F14]">{conversation.name}</h2>
                <p className="text-xs text-[#9A8474] mt-0.5">
                  {members.length} members · {onlineCount} online
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
              <button className="flex-1 flex items-center justify-center gap-2 bg-[#7C5C3E] hover:bg-[#9B7653] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors duration-200">
                <UserPlus className="w-3.5 h-3.5" />
                Add Member
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 border border-red-300/60 hover:bg-red-50 text-red-500 text-xs font-semibold py-2.5 rounded-xl transition-colors duration-200">
                <LogOut className="w-3.5 h-3.5" />
                Leave Group
              </button>
            </div>

            <div className="h-px bg-[#E0D5C5] mx-5 flex-shrink-0" />

            {/* ── Members list ── */}
            <div className="overflow-y-auto chat-scrollbar flex-1 py-3">
              {onlineMembers.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A8474] px-5 pb-2">
                    Online — {onlineMembers.length}
                  </p>
                  {onlineMembers.map((m) => <MemberRow key={m.id} member={m} />)}
                </>
              )}
              {offlineMembers.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A8474] px-5 pt-3 pb-2">
                    Offline — {offlineMembers.length}
                  </p>
                  {offlineMembers.map((m) => <MemberRow key={m.id} member={m} />)}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-[#EDE4D6] transition-colors">
      <div className="relative flex-shrink-0">
        <Avatar src={member.avatar} initials={member.initials} name={member.name} id={member.id} size="md" />
        <span className={cn(
          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#F6EEE3]',
          member.isOnline ? 'bg-[#22C55E]' : 'bg-[#C4B4A0]',
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn('text-sm font-medium truncate', member.id === 'me' ? 'text-[#7C5C3E]' : 'text-[#2A1F14]')}>
            {member.id === 'me' ? `${member.name} (You)` : member.name}
          </p>
          {member.role === 'admin' && (
            <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" />
          )}
        </div>
        <p className="text-xs mt-0.5">
          {member.isOnline
            ? <span className="text-emerald-600 font-medium">Online</span>
            : <span className="text-[#B0A090]">Offline</span>
          }
        </p>
      </div>
    </div>
  )
}
