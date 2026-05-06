import type { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { sendSuccess } from '../../shared/utils/apiResponse.js'
import { getUserById, updateProfile, searchUsers } from './user.service.js'
import type { AuthRequest } from '../../shared/types/index.js'
import type { UpdateProfileInput, SearchUsersQuery } from './user.schemas.js'

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const user = await getUserById(sub)
  sendSuccess(res, user)
})

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.params['userId'] as string)
  sendSuccess(res, user)
})

export const patchMe = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const user = await updateProfile(sub, req.body as UpdateProfileInput)
  sendSuccess(res, user)
})

export const searchUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const result = await searchUsers(req.query as unknown as SearchUsersQuery, sub)
  sendSuccess(res, result)
})
