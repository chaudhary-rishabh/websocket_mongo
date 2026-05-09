import rateLimit from 'express-rate-limit'
import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { logger } from '../shared/utils/logger.js'
import type { AuthRequest } from '../shared/types/index.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Key by authenticated user ID so limits are per-user, not per-IP.
 *  Falls back to IP for unauthenticated routes (e.g. auth endpoints). */
function userKey(req: Request): string {
  return (req as AuthRequest).user?.sub ?? (req.ip ?? 'anonymous')
}

/** Standard rate-limit-exceeded handler — logs the event and returns consistent JSON. */
function onLimitReached(req: Request, res: Response, message: string): void {
  logger.warn(
    { userId: (req as AuthRequest).user?.sub, ip: req.ip, path: req.path },
    'AI rate limit exceeded',
  )
  res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message } })
}

// ── Global / shared limiters ──────────────────────────────────────────────────

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

// ── AI route limiters (all keyed by user ID) ──────────────────────────────────
//
// NOTE: For multi-instance deployments these should use a shared store
// (e.g. rate-limit-redis). The default MemoryStore is correct for a
// single-process server.

/** GET /ai/sessions, GET /ai/messages — 60 reads per minute per user. */
export const aiReadRateLimit = rateLimit({
  windowMs: 60 * 1_000,
  max: 60,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Too many requests — please slow down'),
})

/** POST /ai/sessions, DELETE /ai/sessions* — 10 operations per 10 minutes per user. */
export const aiSessionMutateRateLimit = rateLimit({
  windowMs: 10 * 60 * 1_000,
  max: 10,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Too many session operations — try again in a few minutes'),
})

/** POST /ai/chat — 20 messages per 15 minutes per user. */
export const aiChatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 20,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Chat limit reached — you can send 20 messages every 15 minutes'),
})

/** POST /ai/analyze-user — 5 analyses per hour per user. */
export const aiAnalyzeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1_000,
  max: 5,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    onLimitReached(req, res, 'Analysis limit reached — you can run 5 analyses per hour'),
})
