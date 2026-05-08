'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Phone, Mail, Clock, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import type { User } from '@/lib/schemas'
import { CONVERSATIONS } from '@/lib/mock-data'
import { formatTime, cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'

interface UserProfilePageProps {
  user: User
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon className="w-[18px] h-[18px] text-[#3B82F6] flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-[#6B7280] uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-[#1F2937] truncate">{value}</p>
      </div>
    </div>
  )
}

export default function UserProfilePage({ user }: UserProfilePageProps) {
  const sharedGroups = CONVERSATIONS.filter(
    (c) => c.type === 'group' && c.members.includes(user.id),
  )

  const dmConversation = CONVERSATIONS.find(
    (c) => c.type === 'direct' && c.members.includes(user.id),
  )

  return (
    <div className="min-h-screen bg-white bg-texture">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#BFDBFE] px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="p-2 -ml-1 rounded-full hover:bg-[#DBEAFE] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#6B7280]" />
        </Link>
        <span className="text-sm font-semibold text-[#1F2937]">Profile</span>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-3">

        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#EFF6FF] rounded-[25px] overflow-hidden border border-[#BFDBFE]"
        >
          {/* Gradient strip */}
          <div className="h-20" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #93C5FD 100%)' }} />

          {/* Avatar + identity */}
          <div className="px-5 pb-5 flex flex-col items-center -mt-10">
            <div className="w-20 h-20 rounded-full ring-4 ring-[#EFF6FF] overflow-hidden shadow-md">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name} width={80} height={80} className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#2563EB] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{user.initials}</span>
                </div>
              )}
            </div>

            <h2 className="mt-3 text-base font-bold text-[#1F2937]">{user.name}</h2>

            {user.role && (
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-full">
                {user.role}
              </span>
            )}

            {/* Online / last seen */}
            <div className="mt-2">
              {user.isOnline ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : (
                <span className="text-xs text-[#6B7280]">
                  Last seen {formatTime(user.lastSeen)} ago
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex gap-3 w-full">
              {dmConversation ? (
                <Link
                  href={`/chat/${dmConversation.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Link>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              )}
              <button className="flex items-center justify-center gap-2 border border-[#BFDBFE] hover:bg-[#DBEAFE] text-[#2563EB] text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200">
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-[#EFF6FF] rounded-[25px] overflow-hidden border border-[#BFDBFE]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280] px-5 pt-5 pb-1.5">
            Info
          </p>
          <InfoRow icon={Mail}  label="Email"     value={`${user.name.toLowerCase().replace(' ', '.')}@example.com`} />
          <div className="h-px bg-[#BFDBFE] mx-5" />
          <InfoRow icon={Clock} label="Last seen" value={user.isOnline ? 'Active now' : `${formatTime(user.lastSeen)} ago`} />
          <div className="pb-2" />
        </motion.div>

        {/* ── Shared groups ── */}
        {sharedGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-[#EFF6FF] rounded-[25px] overflow-hidden border border-[#BFDBFE]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6B7280] px-5 pt-5 pb-1.5">
              {sharedGroups.length} Shared Group{sharedGroups.length > 1 ? 's' : ''}
            </p>
            {sharedGroups.map((group, i) => (
              <div key={group.id}>
                {i > 0 && <div className="h-px bg-[#BFDBFE] mx-5" />}
                <Link
                  href={`/chat/${group.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#DBEAFE] transition-colors"
                >
                  <Avatar initials={group.initials} name={group.name} id={group.id} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1F2937] truncate">{group.name}</p>
                    <p className={cn('text-xs text-[#6B7280] flex items-center gap-1 mt-0.5')}>
                      <Users className="w-3 h-3" />
                      {group.members.length} members
                    </p>
                  </div>
                </Link>
              </div>
            ))}
            <div className="pb-2" />
          </motion.div>
        )}

      </div>
    </div>
  )
}
