import { notFound } from 'next/navigation'
import { getUserById, USERS } from '@/lib/mock-data'
import UserProfilePage from '@/components/profile/UserProfilePage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserProfileRoute({ params }: PageProps) {
  const { id } = await params
  const user = getUserById(id)

  if (!user || id === 'me') {
    notFound()
  }

  return <UserProfilePage user={user} />
}

export function generateStaticParams() {
  return USERS.map((u) => ({ id: u.id }))
}
