'use server'

import { auth, signOut } from '@/lib/auth'

export async function logoutAction() {
  const session = await auth()
  if (session?.accessToken) {
    try {
      await fetch(`${process.env.API_URL ?? 'http://localhost:4000'}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
    } catch {
    }
  }
  await signOut({ redirectTo: '/login' })
}
