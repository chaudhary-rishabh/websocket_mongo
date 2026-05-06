import type { Response } from 'express'

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options: { status?: number; message?: string } = {},
): Response {
  const { status = 200, message } = options
  const body: ApiSuccessResponse<T> = { success: true, data, ...(message && { message }) }
  return res.status(status).json(body)
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  options: { status?: number; details?: unknown } = {},
): Response {
  const { status = 400, details } = options
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, ...(details !== undefined && { details }) },
  }
  return res.status(status).json(body)
}
