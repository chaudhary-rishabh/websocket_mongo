'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Camera, Pencil, Check, X,
  Bell, AtSign, Mail,
  LogOut, ArrowLeft, ChevronRight, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/actions/auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/* ─── Toggle ─────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="switch"
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
        checked ? 'bg-[#7C5C3E]' : 'bg-[#D4C4B0]',
      )}
    >
      <span
        className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}

/* ─── Setting row ────────────────────────────────────────────────────── */
function Row({
  icon: Icon, label, sublabel, right, danger,
}: {
  icon: React.ElementType
  label: string
  sublabel?: string
  right?: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', danger ? 'text-red-400' : 'text-[#9B7653]')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', danger ? 'text-red-500' : 'text-[#2A1F14]')}>{label}</p>
        {sublabel && <p className="text-xs text-[#9A8474] mt-0.5 truncate">{sublabel}</p>}
      </div>
      {right ?? <ChevronRight className="w-4 h-4 text-[#C4B4A0]" />}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-[#E0D5C5] mx-5" />
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8474] px-5 pt-5 pb-1.5">
      {children}
    </p>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()

  const [displayName,    setDisplayName]    = useState('')
  const [editingName,    setEditingName]    = useState(false)
  const [nameInput,      setNameInput]      = useState('')
  const [bio,            setBio]            = useState('')
  const [editingBio,     setEditingBio]     = useState(false)
  const [bioInput,       setBioInput]       = useState('')
  const [notif,          setNotif]          = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saveError,      setSaveError]      = useState('')
  const [loggingOut,     setLoggingOut]     = useState(false)

  /* Populate from session once available */
  useEffect(() => {
    if (session?.user) {
      const dn = session.user.displayName || session.user.name || ''
      const b  = session.user.bio ?? ''
      setDisplayName(dn)
      setNameInput(dn)
      setBio(b)
      setBioInput(b)
    }
  }, [session?.user?.displayName, session?.user?.bio])

  const patchMe = async (body: { displayName?: string; bio?: string }) => {
    if (!session?.accessToken) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`${API}/api/v1/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setSaveError(json?.error?.message ?? 'Failed to save changes.')
      } else {
        // Trigger session refresh so UI reflects new values
        await updateSession()
      }
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveName = async () => {
    if (!nameInput.trim()) return
    setDisplayName(nameInput.trim())
    setEditingName(false)
    await patchMe({ displayName: nameInput.trim() })
  }

  const saveBio = async () => {
    if (!bioInput.trim()) return
    setBio(bioInput.trim())
    setEditingBio(false)
    await patchMe({ bio: bioInput.trim() })
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logoutAction()
  }

  /* Derive initials from displayName */
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const avatarUrl = session?.user?.avatar ?? session?.user?.image

  return (
    <div className="min-h-screen bg-white bg-texture">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#E0D5C5] px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="p-2 -ml-1 rounded-full hover:bg-[#EDE4D6] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#9A8474]" />
        </Link>
        <span className="text-sm font-semibold text-[#2A1F14]">My Profile</span>
        {saving && <Loader2 className="w-4 h-4 text-[#9B7653] animate-spin ml-auto" />}
      </div>

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-3">

        {/* ── Save error ── */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">
            {saveError}
          </div>
        )}

        {/* ── Hero card ── */}
        <div className="bg-[#F6EEE3] rounded-[25px] overflow-hidden border border-[#E0D5C5]">
          {/* Gradient strip */}
          <div className="h-20 bg-gradient-to-br from-[#9B7653] to-[#C4A882]" />

          {/* Avatar + identity */}
          <div className="px-5 pb-5 flex flex-col items-center -mt-10">
            {/* Avatar */}
            <motion.div className="relative cursor-pointer">
              <div className="w-20 h-20 rounded-full ring-4 ring-[#F6EEE3] overflow-hidden shadow-md">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName} width={80} height={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#7C5C3E] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{initials || '?'}</span>
                  </div>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>

            {/* Display Name */}
            <div className="mt-3 flex items-center gap-1.5">
              {editingName ? (
                <>
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    className="text-base font-bold text-[#2A1F14] border-b-2 border-[#7C5C3E] outline-none bg-transparent text-center min-w-0 w-44"
                  />
                  <button onClick={saveName}><Check className="w-4 h-4 text-[#7C5C3E]" /></button>
                  <button onClick={() => { setNameInput(displayName); setEditingName(false) }}>
                    <X className="w-4 h-4 text-[#9A8474]" />
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold text-[#2A1F14]">
                    {displayName || <span className="text-[#C4B4A0]">Add your name</span>}
                  </h2>
                  <button
                    onClick={() => { setNameInput(displayName); setEditingName(true) }}
                    className="text-[#C4B4A0] hover:text-[#7C5C3E] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Bio */}
            <div className="mt-1 flex items-center gap-1.5 max-w-xs">
              {editingBio ? (
                <>
                  <input
                    autoFocus
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveBio()}
                    className="text-xs text-[#9A8474] border-b border-[#7C5C3E] outline-none bg-transparent text-center w-56"
                  />
                  <button onClick={saveBio}><Check className="w-3.5 h-3.5 text-[#7C5C3E]" /></button>
                  <button onClick={() => { setBioInput(bio); setEditingBio(false) }}>
                    <X className="w-3.5 h-3.5 text-[#9A8474]" />
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[#9A8474] text-center">
                    {bio || <span className="text-[#C4B4A0]">Add a bio…</span>}
                  </p>
                  <button
                    onClick={() => { setBioInput(bio); setEditingBio(true) }}
                    className="text-[#C4B4A0] hover:text-[#7C5C3E] transition-colors flex-shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {/* Online pill */}
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 border-t border-[#E0D5C5]">
            {[
              { value: '1.2k', label: 'Messages' },
              { value: '4',    label: 'Groups'   },
              { value: '28',   label: 'Contacts'  },
            ].map((s, i) => (
              <div key={i} className={cn('flex flex-col items-center py-4 gap-0.5', i > 0 && 'border-l border-[#E0D5C5]')}>
                <span className="text-base font-bold text-[#2A1F14]">{s.value}</span>
                <span className="text-[11px] text-[#9A8474]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="bg-[#F6EEE3] rounded-[25px] overflow-hidden border border-[#E0D5C5]">
          <SectionLabel>Notifications</SectionLabel>
          <Row
            icon={Bell}
            label="Push Notifications"
            sublabel="Messages, mentions, calls"
            right={<Toggle checked={notif} onChange={setNotif} />}
          />

          <SectionLabel>Account</SectionLabel>
          <Row
            icon={Mail}
            label="Email"
            sublabel={session?.user?.email ?? '—'}
            right={null}
          />
          <Divider />
          <Row
            icon={AtSign}
            label="Username"
            sublabel={session?.user?.username ? `@${session.user.username}` : '—'}
            right={null}
          />
          <div className="pb-2" />
        </div>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-[#F6EEE3] border border-[#E0D5C5] rounded-[25px] py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loggingOut
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <LogOut className="w-4 h-4" />}
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>

      </div>
    </div>
  )
}
