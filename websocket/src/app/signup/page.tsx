'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { MessageSquare, Eye, EyeOff, Loader2, Check, X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import GridBackground from '@/components/GridBackground'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/* Password strength rules */
const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw]   = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const validateStep1 = () => {
    if (!form.displayName.trim()) return 'Display name is required.'
    if (form.username.trim().length < 3) return 'Username must be at least 3 characters.'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username may only contain letters, numbers, and underscores.'
    if (!form.email.includes('@')) return 'Enter a valid email.'
    return null
  }

  const validate = () => {
    const s1 = validateStep1()
    if (s1) return s1
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(form.password)) return 'Password must contain an uppercase letter.'
    if (!/[0-9]/.test(form.password)) return 'Password must contain a number.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
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
    <GridBackground>
<div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">

  {/* Blue backdrop object */}
  <div className="absolute w-[200px] h-[200px] rounded-full bg-blue-500/50 blur-[60px] -z-0" />

  {/* Login Card */}
  <div className="relative z-10 w-full max-w-md bg-white/60 backdrop-blur-md border border-white/40 rounded-[30px] shadow-md p-8">
          {/* Brand — logo beside title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-md flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937]">Create account</h1>
              <p className="text-sm text-[#6B7280]">Join the conversation today</p>
            </div>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-200',
              step === 1
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#2563EB] text-white',
            )}>
              {step === 2 ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : '1'}
            </div>
            <div className={cn(
              'flex-1 h-0.5 rounded-full transition-all duration-300',
              step === 2 ? 'bg-[#2563EB]' : 'bg-[#BFDBFE]',
            )} />
            <div className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-200',
              step === 2
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#BFDBFE] text-[#93C5FD]',
            )}>
              2
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* ── Step 1: Profile info ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
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

              <Field label="Username">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#93C5FD] text-sm font-medium">@</span>
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

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#3B82F6] active:scale-[0.98] transition-all duration-200 mt-1"
              >
                Next →
              </button>
            </div>
          )}

          {/* ── Step 2: Password ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              </Field>

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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#93C5FD] hover:text-[#3B82F6] transition-colors"
                  >
                    {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-[#6B7280] bg-white/80 border border-[#BFDBFE] hover:bg-[#DBEAFE] hover:text-[#2563EB] transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200',
                    loading
                      ? 'bg-[#93C5FD] cursor-not-allowed'
                      : 'bg-[#2563EB] hover:bg-[#3B82F6] active:scale-[0.98]',
                  )}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-neutral-200/60 text-center">
            <p className="text-sm text-[#6B7280]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#2563EB] hover:text-[#3B82F6] transition-colors">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </GridBackground>
  )
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const inputCls =
  'w-full bg-white/80 border border-[#BFDBFE] rounded-xl px-4 py-3 text-sm text-[#1F2937] placeholder:text-[#93C5FD] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}
