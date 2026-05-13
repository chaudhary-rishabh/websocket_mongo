'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Eye, EyeOff, Check, X, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import GridBackground from '@/components/GridBackground'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
]

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/[A-Z]/.test(password)) { setError('Password must contain an uppercase letter.'); return }
    if (!/[0-9]/.test(password)) { setError('Password must contain a number.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? 'Reset failed. The link may have expired.')
        return
      }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  const pwRulesMet = PW_RULES.map((r) => r.test(password))
  const showPwHints = password.length > 0

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-[#1F2937]">Invalid link</h2>
        <p className="text-sm text-[#6B7280] text-center">
          This reset link is missing or invalid.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-[#2563EB] hover:text-[#3B82F6] transition-colors"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-lg font-bold text-[#1F2937]">Password reset</h2>
        <p className="text-sm text-[#6B7280] text-center">
          Your password has been changed. You can now sign in.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] transition-colors"
        >
          Go to login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className="w-full bg-white/80 border border-[#BFDBFE] rounded-xl px-4 py-3 pr-11 text-sm text-[#1F2937] placeholder:text-[#93C5FD] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#93C5FD] hover:text-[#3B82F6] transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {showPwHints && (
          <div className="mt-2 flex flex-col gap-1">
            {PW_RULES.map((rule, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-xs ${pwRulesMet[i] ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>
                {pwRulesMet[i] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {rule.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showCpw ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={cn(
              'w-full bg-white/80 border rounded-xl px-4 py-3 pr-11 text-sm text-[#1F2937] placeholder:text-[#93C5FD] outline-none transition-all duration-200',
              confirmPassword && password !== confirmPassword
                ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                : 'border-[#BFDBFE] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20',
            )}
          />
          <button
            type="button"
            onClick={() => setShowCpw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#93C5FD] hover:text-[#3B82F6] transition-colors"
          >
            {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-1',
          loading
            ? 'bg-[#93C5FD] cursor-not-allowed'
            : 'bg-[#2563EB] hover:bg-[#3B82F6] active:scale-[0.98]',
        )}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Resetting…' : 'Reset Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <GridBackground>
      <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
        <div className="absolute w-[200px] h-[200px] rounded-full bg-blue-500/50 blur-[60px] -z-0" />

        <div className="relative z-10 w-full max-w-md bg-white/60 backdrop-blur-md border border-white/40 rounded-[30px] shadow-md p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-md flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937]">New password</h1>
              <p className="text-sm text-[#6B7280]">Choose a strong password</p>
            </div>
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
            </div>
          }>
            <ResetForm />
          </Suspense>

          <div className="mt-6 pt-5 border-t border-neutral-200/60 text-center">
            <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#3B82F6] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </GridBackground>
  )
}
