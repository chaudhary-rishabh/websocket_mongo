import type { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { sendSuccess } from '../../shared/utils/apiResponse.js'
import { uploadImage, uploadAudio, uploadAvatar } from './media.service.js'
import { updateAvatar } from '../users/user.service.js'
import type { AuthRequest } from '../../shared/types/index.js'
import { AppError } from '../../middleware/error.js'

export const uploadImageHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('NO_FILE', 'No file uploaded', 400)
  const result = await uploadImage(req.file.buffer, req.file.mimetype)
  sendSuccess(res, result, { status: 201 })
})

export const uploadAudioHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('NO_FILE', 'No file uploaded', 400)
  const result = await uploadAudio(req.file.buffer, req.file.mimetype)
  sendSuccess(res, result, { status: 201 })
})

export const uploadAvatarHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('NO_FILE', 'No file uploaded', 400)
  const { sub } = (req as AuthRequest).user
  const result = await uploadAvatar(req.file.buffer, req.file.mimetype, sub)
  const user = await updateAvatar(sub, result.url)
  sendSuccess(res, { user, media: result }, { status: 201 })
})
