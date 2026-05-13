import type { Request, Response } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { sendSuccess } from '../../shared/utils/apiResponse.js'
import { register, login, refresh, logout, forgotPassword, resetPassword } from './auth.service.js'
import type { RegisterInput, LoginInput, RefreshInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schemas.js'
import type { AuthRequest } from '../../shared/types/index.js'

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await register(req.body as RegisterInput)
  sendSuccess(res, result, { status: 201, message: 'Account created' })
})

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await login(req.body as LoginInput)
  sendSuccess(res, result)
})

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshInput
  const result = await refresh(refreshToken)
  sendSuccess(res, result)
})

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = (req as AuthRequest).user
  await logout(sub)
  sendSuccess(res, null, { message: 'Logged out' })
})

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await forgotPassword(req.body as ForgotPasswordInput)
  sendSuccess(res, null, { message: 'If that email is registered, a reset link has been sent.' })
})

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await resetPassword(req.body as ResetPasswordInput)
  sendSuccess(res, null, { message: 'Password has been reset. You can now log in.' })
})
