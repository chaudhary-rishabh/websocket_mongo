'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowRight, Check, X, Loader2, Upload } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const STORAGE_KEY = 'onboarding_completed'

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
}

type Step = 'avatar' | 'name' | 'bio' | 'done'

export default function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { data: session, update: updateSession } = useSession()

  const [step, setStep] = useState<Step>('avatar')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user) {
      setDisplayName(session.user.displayName || session.user.name || '')
      setBio(session.user.bio || '')
    }
  }, [session?.user])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !session?.accessToken) return null
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', avatarFile)
      const res = await authFetch(`${API}/api/v1/media/avatar`, {
        method: 'POST',
        body: form,
      }, session.accessToken)
      const json = await res.json()
      if (json.success && json.data?.url) return json.data.url as string
      return null
    } catch {
      return null
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async (body: { displayName?: string; bio?: string }) => {
    if (!session?.accessToken) return
    setSaving(true)
    try {
      await authFetch(
        `${API}/api/v1/users/me`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        session.accessToken,
      )
      await updateSession()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (step === 'avatar') {
      if (avatarFile) await uploadAvatar()
      setStep('name')
      return
    }
    if (step === 'name') {
      if (displayName.trim()) await saveProfile({ displayName: displayName.trim() })
      setStep('bio')
      return
    }
    if (step === 'bio') {
      if (bio.trim()) await saveProfile({ bio: bio.trim() })
      setStep('done')
      return
    }
  }

  const handleSkip = () => {
    if (step === 'avatar') { setStep('name'); return }
    if (step === 'name') { setStep('bio'); return }
    if (step === 'bio') { setStep('done'); return }
  }

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    onClose()
  }

  const userInitials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleFinish}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              className="w-full max-w-md bg-white shadow-2xl overflow-hidden"
              style={{ borderRadius: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {step === 'done' ? (
                <DoneStep displayName={displayName} initials={userInitials} avatarPreview={avatarPreview} onFinish={handleFinish} />
              ) : (
                <>
                  <div className="px-6 pt-8 pb-2">
                    <StepIndicator current={step} />
                  </div>

                  {step === 'avatar' && (
                    <AvatarStep
                      avatarPreview={avatarPreview}
                      userInitials={userInitials}
                      fileInputRef={fileInputRef}
                      onFileSelect={handleFileSelect}
                      uploading={uploading}
                    />
                  )}

                  {step === 'name' && (
                    <NameStep
                      displayName={displayName}
                      onChange={setDisplayName}
                      saving={saving}
                    />
                  )}

                  {step === 'bio' && (
                    <BioStep
                      bio={bio}
                      onChange={setBio}
                      saving={saving}
                    />
                  )}

                  <div className="flex items-center gap-3 px-6 pb-8 pt-4">
                    <button
                      onClick={handleSkip}
                      className="text-sm font-medium text-[#6B7280] hover:text-[#1F2937] transition-colors px-4 py-2.5"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={uploading || saving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {(uploading || saving) && <Loader2 className="w-4 h-4 animate-spin" />}
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'avatar', label: 'Photo' },
    { key: 'name', label: 'Name' },
    { key: 'bio', label: 'Bio' },
  ]
  const currentIdx = steps.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center justify-center gap-3">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                i <= currentIdx ? 'bg-[#2563EB] text-white' : 'bg-[#DBEAFE] text-[#93C5FD]',
              )}
            >
              {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-[10px] text-[#6B7280]">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('h-px w-6 mt-[-14px] transition-colors', i < currentIdx ? 'bg-[#2563EB]' : 'bg-[#BFDBFE]')} />
          )}
        </div>
      ))}
    </div>
  )
}

function AvatarStep({
  avatarPreview, userInitials, fileInputRef, onFileSelect, uploading,
}: {
  avatarPreview: string | null
  userInitials: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-6">
      <h2 className="text-lg font-bold text-[#1F2937]">Add a profile photo</h2>
      <p className="text-sm text-[#6B7280] text-center -mt-2">
        Help others recognise you
      </p>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelect} />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group cursor-pointer disabled:opacity-60"
      >
        <div className="w-28 h-28 rounded-full ring-4 ring-[#DBEAFE] overflow-hidden shadow-lg">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#2563EB] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{userInitials || '?'}</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
        {!uploading && (
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center shadow-md">
            <Upload className="w-4 h-4 text-white" />
          </div>
        )}
      </button>
    </div>
  )
}

function NameStep({
  displayName, onChange, saving,
}: {
  displayName: string
  onChange: (v: string) => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-6">
      <h2 className="text-lg font-bold text-[#1F2937]">Your display name</h2>
      <p className="text-sm text-[#6B7280] text-center -mt-2">
        This is how others will see you
      </p>
      <div className="w-full relative">
        <input
          autoFocus
          type="text"
          value={displayName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your name"
          maxLength={60}
          disabled={saving}
          className="w-full bg-[#EFF6FF] border border-[#BFDBFE] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-2xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none transition-all disabled:opacity-60"
        />
      </div>
    </div>
  )
}

function BioStep({
  bio, onChange, saving,
}: {
  bio: string
  onChange: (v: string) => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-6">
      <h2 className="text-lg font-bold text-[#1F2937]">Add a status or bio</h2>
      <p className="text-sm text-[#6B7280] text-center -mt-2">
        Let people know a little about you
      </p>
      <div className="w-full relative">
        <textarea
          autoFocus
          value={bio}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Software engineer, coffee lover…"
          maxLength={300}
          rows={3}
          disabled={saving}
          className="w-full bg-[#EFF6FF] border border-[#BFDBFE] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-2xl px-4 py-3 text-sm text-[#1F2937] placeholder-[#9CA3AF] outline-none transition-all resize-none disabled:opacity-60"
        />
        <p className="text-[11px] text-[#9CA3AF] text-right mt-1">{bio.length}/300</p>
      </div>
    </div>
  )
}

function DoneStep({
  displayName, initials, avatarPreview, onFinish,
}: {
  displayName: string
  initials: string
  avatarPreview: string | null
  onFinish: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-10">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
      >
        <Check className="w-8 h-8 text-emerald-600" />
      </motion.div>

      <h2 className="text-lg font-bold text-[#1F2937]">You&rsquo;re all set!</h2>
      <p className="text-sm text-[#6B7280] text-center -mt-2">
        {displayName ? `Welcome, ${displayName}!` : 'Welcome!'}
        <br />Your profile is ready.
      </p>

      <div className="flex items-center gap-3 mt-2 bg-[#EFF6FF] rounded-2xl px-5 py-3 border border-[#BFDBFE]">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2563EB] flex items-center justify-center flex-shrink-0">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white">{initials || '?'}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1F2937]">{displayName || 'User'}</p>
          <p className="text-xs text-[#6B7280]">Profile updated</p>
        </div>
      </div>

      <button
        onClick={onFinish}
        className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] transition-colors"
      >
        Start chatting
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
