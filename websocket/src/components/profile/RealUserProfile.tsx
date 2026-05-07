'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageCircle, Phone, Clock, AtSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatTime } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface ApiUser {
  _id: string
  username: string
  displayName: string
  avatar?: string
  isOnline: boolean
  lastSeen?: string
}

export default function RealUserProfile({ userId }: { userId: string }) {
  const { data: session } = useSession()
  const [user, setUser] = useState<ApiUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`${API}/api/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUser(json.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [userId, session?.accessToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-white bg-texture flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C4A882] border-t-[#7C5C3E] animate-spin" />
          <p className="text-sm text-[#9A8474]">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-white bg-texture flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#9A8474]">Profile not found</p>
        <Link href="/chat" className="text-xs font-semibold text-[#7C5C3E] hover:underline">
          Back to chat
        </Link>
      </div>
    )
  }

  const initials = user.displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-white bg-texture">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#E0D5C5] px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="p-2 -ml-1 rounded-full hover:bg-[#EDE4D6] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#9A8474]" />
        </Link>
        <span className="text-sm font-semibold text-[#2A1F14]">Profile</span>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-3">

        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#F6EEE3] rounded-[25px] overflow-hidden border border-[#E0D5C5]"
        >
          <div className="h-20" style={{ background: 'linear-gradient(135deg, #9B7653 0%, #C4A882 100%)' }} />

          <div className="px-5 pb-5 flex flex-col items-center -mt-10">
            <div className="w-20 h-20 rounded-full ring-4 ring-[#F6EEE3] overflow-hidden shadow-md bg-[#D4C4B0]">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.displayName}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-[#7C5C3E] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{initials}</span>
                </div>
              )}
            </div>

            <h2 className="mt-3 text-base font-bold text-[#2A1F14]">{user.displayName}</h2>
            <p className="text-xs text-[#9A8474] mt-0.5">@{user.username}</p>

            <div className="mt-2">
              {user.isOnline ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : (
                <span className="text-xs text-[#9A8474]">
                  {user.lastSeen
                    ? `Last seen ${formatTime(user.lastSeen)} ago`
                    : 'Offline'}
                </span>
              )}
            </div>

            <div className="mt-5 flex gap-3 w-full">
              <button className="flex-1 flex items-center justify-center gap-2 bg-[#7C5C3E] hover:bg-[#9B7653] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors duration-200">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
              <button className="flex items-center justify-center gap-2 border border-[#E0D5C5] hover:bg-[#EDE4D6] text-[#7C5C3E] text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors duration-200">
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Info card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-[#F6EEE3] rounded-[25px] overflow-hidden border border-[#E0D5C5]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8474] px-5 pt-5 pb-1.5">
            Info
          </p>

          <div className="flex items-center gap-3 px-5 py-3.5">
            <AtSign className="w-[18px] h-[18px] text-[#9B7653] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-[#9A8474] uppercase tracking-wide">Username</p>
              <p className="text-sm font-medium text-[#2A1F14] truncate">@{user.username}</p>
            </div>
          </div>

          <div className="h-px bg-[#E0D5C5] mx-5" />

          <div className="flex items-center gap-3 px-5 py-3.5">
            <Clock className="w-[18px] h-[18px] text-[#9B7653] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-[#9A8474] uppercase tracking-wide">Last seen</p>
              <p className="text-sm font-medium text-[#2A1F14]">
                {user.isOnline
                  ? 'Active now'
                  : user.lastSeen
                    ? `${formatTime(user.lastSeen)} ago`
                    : 'Unknown'}
              </p>
            </div>
          </div>

          <div className="pb-2" />
        </motion.div>

      </div>
    </div>
  )
}
