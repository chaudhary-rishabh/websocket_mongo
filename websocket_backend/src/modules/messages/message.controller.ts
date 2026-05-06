import type { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { sendSuccess } from '../../shared/utils/apiResponse.js'
import {
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  markRead,
} from './message.service.js'
import type { AuthRequest } from '../../shared/types/index.js'
import type { SendMessageInput, EditMessageInput, ReactInput, MessageQuery } from './message.schemas.js'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const result = await listMessages(
    req.params['conversationId'] as string,
    sub,
    req.query as unknown as MessageQuery,
  )
  sendSuccess(res, result)
})

export const send = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const msg = await sendMessage(req.params['conversationId'] as string, sub, req.body as SendMessageInput)
  sendSuccess(res, msg, { status: 201 })
})

export const edit = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const msg = await editMessage(req.params['messageId'] as string, sub, req.body as EditMessageInput)
  sendSuccess(res, msg)
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  await deleteMessage(req.params['messageId'] as string, sub)
  sendSuccess(res, null, { message: 'Message deleted' })
})

export const react = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  const msg = await addReaction(req.params['messageId'] as string, sub, req.body as ReactInput)
  sendSuccess(res, msg)
})

export const read = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  await markRead(req.params['conversationId'] as string, sub)
  sendSuccess(res, null, { message: 'Marked as read' })
})
