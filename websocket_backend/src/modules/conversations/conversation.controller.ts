import type { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { sendSuccess } from '../../shared/utils/apiResponse.js'
import {
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  addMembers,
  leaveConversation,
} from './conversation.service.js'
import type { AuthRequest } from '../../shared/types/index.js'
import type {
  CreateConversationInput,
  UpdateConversationInput,
  AddMembersInput,
} from './conversation.schemas.js'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const convs = await listConversations(sub)
  sendSuccess(res, convs)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const conv = await createConversation(req.body as CreateConversationInput, sub)
  sendSuccess(res, conv, { status: 201 })
})

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const conv = await getConversation(req.params['conversationId'] as string, sub)
  sendSuccess(res, conv)
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const conv = await updateConversation(
    req.params['conversationId'] as string,
    sub,
    req.body as UpdateConversationInput,
  )
  sendSuccess(res, conv)
})

export const addMembersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const conv = await addMembers(req.params['conversationId'] as string, sub, req.body as AddMembersInput)
  sendSuccess(res, conv)
})

export const leave = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  await leaveConversation(req.params['conversationId'] as string, sub)
  sendSuccess(res, null, { message: 'Left conversation' })
})
