'use client'

import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const Provider = SessionProvider as any
  return <Provider>{children}</Provider>
}
