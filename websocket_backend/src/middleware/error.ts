import type { Request, Response, NextFunction } from 'express'
import { logger } from '../shared/utils/logger.js'
import { sendError } from '../shared/utils/apiResponse.js'
import { env } from '../config/env.js'

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public override readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }

  static notFound(resource = 'Resource') {
    return new AppError('NOT_FOUND', `${resource} not found`, 404)
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message = 'Forbidden') {
    return new AppError('FORBIDDEN', message, 403)
  }

  static conflict(message: string) {
    return new AppError('CONFLICT', message, 409)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, reqId: (req as Request & { requestId?: string }).requestId }, err.message)
    }
    sendError(res, err.code, err.message, { status: err.statusCode, details: err.details })
    return
  }

  // Mongoose duplicate key
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000) {
    sendError(res, 'CONFLICT', 'Duplicate entry', { status: 409 })
    return
  }

  // Mongoose cast error
  if (typeof err === 'object' && err !== null && 'name' in err && (err as { name: unknown }).name === 'CastError') {
    sendError(res, 'INVALID_ID', 'Invalid resource ID', { status: 400 })
    return
  }

  logger.error({ err, reqId: (req as Request & { requestId?: string }).requestId }, 'Unhandled error')

  sendError(res, 'INTERNAL_ERROR', env.NODE_ENV === 'production' ? 'Internal server error' : String(err), { status: 500 })
}
