'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { MessageSquare, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import GridBackground from '@/components/GridBackground'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push('/chat')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <GridBackground>
<div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">

  {/* Blue backdrop object */}
  <div className="absolute w-[200px] h-[200px] rounded-full bg-blue-500/50 blur-[60px] -z-0" />

  {/* Login Card */}
  <div className="relative z-10 w-full max-w-md bg-white/60 backdrop-blur-md border border-white/40 rounded-[30px] shadow-md p-8">
          {/* Brand — logo beside title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-md flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937]">Welcome back</h1>
              <p className="text-sm text-[#6B7280]">Sign in to continue chatting</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-white/80 border border-[#BFDBFE] rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder:text-[#93C5FD] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>

            {/* Submit */}
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-neutral-200/60 text-center">
            <p className="text-sm text-[#6B7280]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-[#2563EB] hover:text-[#3B82F6] transition-colors">
                Sign up
              </Link>
            </p>
          </div>

        </div>
      </div>
    </GridBackground>
  )
}
