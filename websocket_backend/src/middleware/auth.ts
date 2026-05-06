import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { jwtVerify } from 'jose'
import { getPublicKey } from '../config/jwt.js'
import { sendError } from '../shared/utils/apiResponse.js'
import type { AuthPayload, AuthRequest } from '../shared/types/index.js'

export function authenticate(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      sendError(res, 'UNAUTHORIZED', 'Missing or invalid authorization header', { status: 401 })
      return
    }

    const token = header.slice(7)
    try {
      const { payload } = await jwtVerify<AuthPayload>(token, getPublicKey(), {
        algorithms: ['RS256'],
      })
      ;(req as AuthRequest).user = payload
      next()
    } catch {
      sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', { status: 401 })
    }
  }
}

export function requireRole(...roles: AuthPayload['role'][]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user
    if (!roles.includes(user.role)) {
      sendError(res, 'FORBIDDEN', 'Insufficient permissions', { status: 403 })
      return
    }
    next()
  }
}
