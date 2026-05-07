import { getUserById, USERS } from '@/lib/mock-data'
import UserProfilePage from '@/components/profile/UserProfilePage'
import RealUserProfile from '@/components/profile/RealUserProfile'

const REAL_ID = /^[0-9a-f]{24}$/i

interface PageProps {
  params: Promise<{ id: string }>
}

// Allow on-demand rendering for real MongoDB user IDs
export const dynamicParams = true

export default async function UserProfileRoute({ params }: PageProps) {
  const { id } = await params

  if (REAL_ID.test(id)) {
    return <RealUserProfile userId={id} />
  }

  const user = getUserById(id)
  if (!user || id === 'me') {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#9A8474] text-sm">
        User not found
      </div>
    )
  }

  return <UserProfilePage user={user} />
}

export function generateStaticParams() {
  return USERS.map((u) => ({ id: u.id }))
}
