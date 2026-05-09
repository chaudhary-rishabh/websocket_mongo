import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

const API = process.env.API_URL ?? 'http://localhost:4000'

export default async function ChatIndexPage() {
  const session = await auth()

  if (session?.accessToken) {
    try {
      const res = await fetch(`${API}/api/v1/conversations`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        redirect(`/chat/${json.data[0]._id}`)
      }
    } catch {
      // fall through to mock default
    }
  }

  redirect('/chat/conv-1')
}
