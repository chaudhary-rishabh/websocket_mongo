import 'dotenv-safe/config.js'
import http from 'http'
import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { initJWT } from './config/jwt.js'
import { initCloudinary } from './config/cloudinary.js'
import { createWebSocketServer } from './websocket/ws.server.js'
import { logger } from './shared/utils/logger.js'

async function bootstrap(): Promise<void> {
  // Initialize config dependencies in order
  await initJWT()
  initCloudinary()
  await connectDB()

  const httpServer = http.createServer(app)
  createWebSocketServer(httpServer)

  httpServer.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      `Server listening on http://localhost:${env.PORT}`,
    )
  })

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received')
    httpServer.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
    setTimeout(() => {
      logger.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10_000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception')
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection')
    process.exit(1)
  })
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err)
  process.exit(1)
})
