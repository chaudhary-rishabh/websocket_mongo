import { Story, type IStory } from './story.model.js'
import { AppError } from '../../middleware/error.js'

export async function createStory(userId: string, mediaUrl: string, caption?: string): Promise<IStory> {
  const doc: Record<string, unknown> = { userId, mediaUrl }
  if (caption) doc.caption = caption
  return Story.create(doc)
}

export async function getActiveStories(): Promise<Array<{ user: Record<string, unknown>; stories: IStory[] }>> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const raw = await Story.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        stories: { $push: '$$ROOT' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $sort: { 'stories.createdAt': -1 } },
  ])

  return raw.map((r) => ({
    user: { _id: r.user._id, username: r.user.username, displayName: r.user.displayName, avatar: r.user.avatar },
    stories: r.stories,
  }))
}

export async function getUserActiveStories(userId: string): Promise<IStory[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return Story.find({ userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean()
}

export async function getStoryPresence(): Promise<Array<{ userId: string; storyCount: number }>> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const raw = await Story.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$userId', storyCount: { $sum: 1 } } },
  ])

  return raw.map((r) => ({ userId: r._id.toString(), storyCount: r.storyCount }))
}

export async function addViewer(storyId: string, viewerId: string): Promise<IStory> {
  const story = await Story.findByIdAndUpdate(
    storyId,
    { $addToSet: { viewers: { userId: viewerId, viewedAt: new Date() } } },
    { new: true },
  )
  if (!story) throw AppError.notFound('Story')
  return story
}

export async function deleteStory(storyId: string, userId: string): Promise<void> {
  const story = await Story.findOneAndDelete({ _id: storyId, userId })
  if (!story) throw AppError.notFound('Story')
}

export async function getStoryById(storyId: string): Promise<IStory> {
  const story = await Story.findById(storyId).lean()
  if (!story) throw AppError.notFound('Story')
  return story as IStory
}
