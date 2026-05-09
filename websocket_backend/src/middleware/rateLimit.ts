import rateLimit from 'express-rate-limit'
import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { logger } from '../shared/utils/logger.js'
import type { AuthRequest } from '../shared/types/index.js'

function userKey(req: Request): string {
  return (req as AuthRequest).user?.sub ?? (req.ip ?? 'anonymous')
}

function onLimitReached(req: Request, res: Response, message: string): void {
  logger.warn(
    { userId: (req as AuthRequest).user?.sub, ip: req.ip, path: req.path },
    'AI rate limit exceeded',
  )
  res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message } })
}

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
})

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many uploads' } },
})

export const aiReadRateLimit = rateLimit({
  windowMs: 60 * 1_000,
  max: 60,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Too many requests — please slow down'),
})

export const aiSessionMutateRateLimit = rateLimit({
  windowMs: 10 * 60 * 1_000,
  max: 10,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Too many session operations — try again in a few minutes'),
})

export const aiChatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 20,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Chat limit reached — you can send 20 messages every 15 minutes'),
})

export const aiAnalyzeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1_000,
  max: 5,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Analysis limit reached — you can run 5 analyses per hour'),
})
