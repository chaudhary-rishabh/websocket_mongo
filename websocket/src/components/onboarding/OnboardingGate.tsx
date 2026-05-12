'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import OnboardingModal from './OnboardingModal'

const STORAGE_KEY = 'onboarding_completed'

export default function OnboardingGate() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (checked || !session?.user) return
    setChecked(true)

    if (localStorage.getItem(STORAGE_KEY) === 'true') return

    const missingFields =
      !session.user.avatar ||
      !session.user.bio ||
      !session.user.displayName

    if (missingFields) {
      const t = setTimeout(() => setShow(true), 600)
      return () => clearTimeout(t)
    }
  }, [session?.user, checked])

  return <OnboardingModal open={show} onClose={() => setShow(false)} />
}
