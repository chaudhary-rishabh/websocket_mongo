'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { MessageSquare, Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/* Password strength rules */
const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',           test: (p: string) => /[0-9]/.test(p) },
]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw]       = useState(false)
  const [showCpw, setShowCpw]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const validate = () => {
    if (!form.displayName.trim()) return 'Display name is required.'
    if (form.username.trim().length < 3) return 'Username must be at least 3 characters.'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username may only contain letters, numbers, and underscores.'
    if (!form.email.includes('@')) return 'Enter a valid email.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(form.password)) return 'Password must contain an uppercase letter.'
    if (!/[0-9]/.test(form.password)) return 'Password must contain a number.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError('')
    setLoading(true)
    try {
      /* 1. Register */
      const res = await fetch(`${API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          username: form.username.trim(),
          displayName: form.displayName.trim(),
          password: form.password,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? 'Registration failed. Please try again.')
        return
      }

      /* 2. Auto sign-in */
      const signInResult = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
      })
      if (signInResult?.error) {
        // Registration succeeded but auto-login failed — send to login
        router.push('/login')
      } else {
        router.push('/chat')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const pwRulesMet = PW_RULES.map((r) => r.test(form.password))
  const showPwHints = form.password.length > 0

  return (
    <div className="min-h-screen bg-white bg-texture flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#7C5C3E] flex items-center justify-center shadow-md mb-4">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2A1F14]">Create account</h1>
          <p className="text-sm text-[#9A8474] mt-1">Join the conversation today</p>
        </div>

        {/* Card */}
        <div className="bg-[#F6EEE3] rounded-[25px] border border-[#E0D5C5] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Display Name */}
            <Field label="Display Name">
              <input
                type="text"
                value={form.displayName}
                onChange={set('displayName')}
                placeholder="Your full name"
                autoComplete="name"
                className={inputCls}
              />
            </Field>

            {/* Username */}
            <Field label="Username">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4B4A0] text-sm font-medium">@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  placeholder="your_username"
                  autoComplete="username"
                  className={cn(inputCls, 'pl-8')}
                />
              </div>
            </Field>

            {/* Email */}
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputCls}
              />
            </Field>

            {/* Password */}
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(inputCls, 'pr-11')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B4A0] hover:text-[#9B7653] transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showPwHints && (
                <div className="mt-2 flex flex-col gap-1">
                  {PW_RULES.map((rule, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-xs ${pwRulesMet[i] ? 'text-emerald-600' : 'text-[#B0A090]'}`}>
                      {pwRulesMet[i]
                        ? <Check className="w-3 h-3" />
                        : <X className="w-3 h-3" />}
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password">
              <div className="relative">
                <input
                  type={showCpw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(
                    inputCls,
                    'pr-11',
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : '',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCpw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C4B4A0] hover:text-[#9B7653] transition-colors"
                >
                  {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-1',
                loading
                  ? 'bg-[#C4A882] cursor-not-allowed'
                  : 'bg-[#7C5C3E] hover:bg-[#9B7653] active:scale-[0.98]',
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#9A8474] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#7C5C3E] hover:text-[#9B7653] transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const inputCls =
  'w-full bg-white border border-[#E0D5C5] rounded-xl px-4 py-3 text-sm text-[#2A1F14] placeholder:text-[#C4B4A0] outline-none focus:border-[#9B7653] focus:ring-2 focus:ring-[#9B7653]/20 transition-all duration-200'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#7C5C3E] uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}
