import { User, type IUser } from './user.model.js'
import { AppError } from '../../middleware/error.js'
import type { UpdateProfileInput, SearchUsersQuery } from './user.schemas.js'

export async function getUserById(userId: string): Promise<IUser> {
  const user = await User.findById(userId)
  if (!user) throw AppError.notFound('User')
  return user
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
  const user = await User.findByIdAndUpdate(userId, { $set: input }, { new: true, runValidators: true })
  if (!user) throw AppError.notFound('User')
  return user
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<IUser> {
  const user = await User.findByIdAndUpdate(userId, { $set: { avatar: avatarUrl } }, { new: true })
  if (!user) throw AppError.notFound('User')
  return user
}

export async function searchUsers(query: SearchUsersQuery, currentUserId: string) {
  const { q, page, limit } = query
  const skip = (page - 1) * limit

  const filter = {
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { displayName: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: currentUserId },
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ])

  return {
    items: users,
    total,
    page,
    limit,
    hasMore: skip + users.length < total,
  }
}

export async function setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $set: { isOnline, ...(!isOnline && { lastSeen: new Date() }) },
  })
}
