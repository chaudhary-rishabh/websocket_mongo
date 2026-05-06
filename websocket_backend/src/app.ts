import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import hpp from 'hpp'
import mongoSanitize from 'express-mongo-sanitize'
// pino-http uses CJS exports; cast for ESM + NodeNext compat
import _pinoHttp from 'pino-http'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoHttp = _pinoHttp as any as (opts: object) => import('express').RequestHandler
import { env } from './config/env.js'
import { logger } from './shared/utils/logger.js'
import { requestId } from './middleware/requestId.js'
import { globalRateLimit } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/error.js'

// Routes
import authRoutes from './modules/auth/auth.routes.js'
import userRoutes from './modules/users/user.routes.js'
import conversationRoutes from './modules/conversations/conversation.routes.js'
import messageRoutes from './modules/messages/message.routes.js'
import mediaRoutes from './modules/media/media.routes.js'

const app = express()

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  }),
)
app.use(hpp())
app.use(mongoSanitize())

// ── Request parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── Observability ────────────────────────────────────────────────────────────
app.use(requestId)
app.use(
  pinoHttp({
    logger,
    customLogLevel(_req: unknown, res: { statusCode: number }) {
      if (res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    serializers: {
      req: (req: { method: string; url: string; id: string }) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
  }),
)

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(globalRateLimit)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// ── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1'

app.use(`${API}/auth`, authRoutes)
app.use(`${API}/users`, userRoutes)
app.use(`${API}/conversations`, conversationRoutes)
app.use(`${API}/conversations/:conversationId/messages`, messageRoutes)
app.use(`${API}/media`, mediaRoutes)

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// ── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler)

export default app
