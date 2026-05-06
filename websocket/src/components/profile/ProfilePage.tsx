'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Camera, Pencil, Check, X,
  Bell, Eye, Moon, Phone, Mail,
  LogOut, ArrowLeft, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CURRENT_USER } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

/* ─── Toggle ─────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="switch"
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
        checked ? 'bg-[#6C63FF]' : 'bg-gray-200',
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
  icon: Icon,
  label,
  sublabel,
  right,
  danger,
}: {
  icon: React.ElementType
  label: string
  sublabel?: string
  right?: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon className={cn('w-[18px] h-[18px] flex-shrink-0', danger ? 'text-red-400' : 'text-[#6C63FF]')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', danger ? 'text-red-500' : 'text-[#1A1A2E]')}>{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5 truncate">{sublabel}</p>}
      </div>
      {right ?? <ChevronRight className="w-4 h-4 text-gray-300" />}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-gray-50 mx-5" />
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 px-5 pt-5 pb-1.5">
      {children}
    </p>
  )
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const [name, setName] = useState(CURRENT_USER.name)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(CURRENT_USER.name)
  const [bio, setBio] = useState('Building the future, one pixel at a time.')
  const [editingBio, setEditingBio] = useState(false)
  const [bioInput, setBioInput] = useState(bio)

  const [notif, setNotif] = useState(true)
  const [lastSeen, setLastSeen] = useState(true)
  const [receipts, setReceipts] = useState(true)
  const [dark, setDark] = useState(false)

  const saveName = () => { if (nameInput.trim()) setName(nameInput.trim()); setEditingName(false) }
  const saveBio  = () => { if (bioInput.trim())  setBio(bioInput.trim());   setEditingBio(false)  }

  return (
    <div className="min-h-screen bg-[#F0F2FF]">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="p-2 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <span className="text-sm font-semibold text-[#1A1A2E]">My Profile</span>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-3">

        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Gradient strip */}
          <div className="h-20 bg-gradient-to-br from-[#6C63FF] to-indigo-400" />

          {/* Avatar + identity */}
          <div className="px-5 pb-5 flex flex-col items-center -mt-10">
            {/* Avatar */}
            <motion.div className="relative">
              <div className="w-20 h-20 rounded-full ring-4 ring-white overflow-hidden shadow-md">
                {CURRENT_USER.avatar ? (
                  <Image src={CURRENT_USER.avatar} alt={name} width={80} height={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-violet-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{CURRENT_USER.initials}</span>
                  </div>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>

            {/* Name */}
            <div className="mt-3 flex items-center gap-1.5">
              {editingName ? (
                <>
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                    className="text-base font-bold text-[#1A1A2E] border-b-2 border-[#6C63FF] outline-none bg-transparent text-center min-w-0 w-44"
                  />
                  <button onClick={saveName}><Check className="w-4 h-4 text-[#6C63FF]" /></button>
                  <button onClick={() => setEditingName(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold text-[#1A1A2E]">{name}</h2>
                  <button onClick={() => { setNameInput(name); setEditingName(true) }} className="text-gray-300 hover:text-[#6C63FF] transition-colors">
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
                    className="text-xs text-gray-500 border-b border-[#6C63FF] outline-none bg-transparent text-center w-56"
                  />
                  <button onClick={saveBio}><Check className="w-3.5 h-3.5 text-[#6C63FF]" /></button>
                  <button onClick={() => setEditingBio(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 text-center">{bio}</p>
                  <button onClick={() => { setBioInput(bio); setEditingBio(true) }} className="text-gray-300 hover:text-[#6C63FF] transition-colors flex-shrink-0">
                    <Pencil className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            {/* Online pill */}
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 border-t border-gray-50">
            {[
              { value: '1.2k', label: 'Messages' },
              { value: '4',    label: 'Groups'   },
              { value: '28',   label: 'Contacts'  },
            ].map((s, i) => (
              <div key={i} className={cn('flex flex-col items-center py-4 gap-0.5', i > 0 && 'border-l border-gray-50')}>
                <span className="text-base font-bold text-[#1A1A2E]">{s.value}</span>
                <span className="text-[11px] text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <SectionLabel>Notifications</SectionLabel>
          <Row icon={Bell} label="Push Notifications" sublabel="Messages, mentions, calls" right={<Toggle checked={notif} onChange={setNotif} />} />

          <SectionLabel>Privacy</SectionLabel>
          <Row icon={Eye}   label="Last Seen"      sublabel="Show your last active time"   right={<Toggle checked={lastSeen} onChange={setLastSeen} />} />
          <Divider />
          <Row icon={Check} label="Read Receipts"  sublabel="Let others see when you've read" right={<Toggle checked={receipts} onChange={setReceipts} />} />

          <SectionLabel>Appearance</SectionLabel>
          <Row icon={Moon} label="Dark Mode" sublabel="Coming soon" right={<Toggle checked={dark} onChange={setDark} />} />

          <SectionLabel>Account</SectionLabel>
          <Row icon={Mail}  label="Email" sublabel="jordan.blake@example.com" right={null} />
          <Divider />
          <Row icon={Phone} label="Phone" sublabel="+1 (555) 012-3456" right={null} />
          <div className="pb-2" />
        </div>

        {/* ── Logout ── */}
        <button className="w-full bg-white rounded-2xl shadow-sm py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors duration-200">
          <LogOut className="w-4 h-4" />
          Log out
        </button>

      </div>
    </div>
  )
}
