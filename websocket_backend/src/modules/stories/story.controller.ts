import type { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { sendSuccess } from '../../shared/utils/apiResponse.js'
import { uploadImage } from '../media/media.service.js'
import {
  createStory,
  getActiveStories,
  getUserActiveStories,
  getStoryPresence,
  addViewer,
  deleteStory,
} from './story.service.js'
import type { CreateStoryInput } from './story.schemas.js'
import type { AuthRequest } from '../../shared/types/index.js'
import { AppError } from '../../middleware/error.js'

export const getActiveStoriesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getActiveStories()
  sendSuccess(res, data)
})

export const getStoryPresenceHandler = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getStoryPresence()
  sendSuccess(res, data)
})

export const getUserStoriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getUserActiveStories(req.params.userId as string)
  sendSuccess(res, data)
})

export const getMyStoriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const data = await getUserActiveStories(sub)
  sendSuccess(res, data)
})

export const createStoryHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('NO_FILE', 'No file uploaded', 400)
  const { sub } = (req as AuthRequest).user
  const { caption } = req.body as CreateStoryInput
  const upload = await uploadImage(req.file.buffer, req.file.mimetype, 'chatapp/stories')
  const story = await createStory(sub, upload.url, caption)
  sendSuccess(res, story, { status: 201 })
})

export const viewStoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const story = await addViewer(req.params.storyId as string, sub)
  sendSuccess(res, story)
})

export const deleteStoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  await deleteStory(req.params.storyId as string, sub)
  sendSuccess(res, null, { message: 'Story deleted' })
})
