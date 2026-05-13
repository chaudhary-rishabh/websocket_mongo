'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Mail, Loader2, Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import GridBackground from '@/components/GridBackground'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) { setError('Enter a valid email.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? 'Something went wrong. Please try again.')
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

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
              <h1 className="text-xl font-bold text-[#1F2937]">Reset password</h1>
              <p className="text-sm text-[#6B7280]">We&apos;ll send a reset link to your email</p>
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-[#1F2937]">Check your email</h2>
              <p className="text-sm text-[#6B7280] text-center leading-relaxed">
                If <span className="font-medium text-[#1F2937]">{email}</span> is registered,
                we&apos;ve sent a reset link.
              </p>
              <Link
                href="/login"
                className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#3B82F6] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#93C5FD]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-white/80 border border-[#BFDBFE] rounded-xl pl-11 pr-4 py-3 text-sm text-[#1F2937] placeholder:text-[#93C5FD] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200"
                  />
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
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {!sent && (
            <div className="mt-6 pt-5 border-t border-neutral-200/60 text-center">
              <p className="text-sm text-[#6B7280]">
                Remember your password?{' '}
                <Link href="/login" className="font-semibold text-[#2563EB] hover:text-[#3B82F6] transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </GridBackground>
  )
}
