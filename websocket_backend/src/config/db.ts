import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../shared/utils/logger.js'

/**
 * Drop the old unique index on aisessions.userId if it still exists.
 * This was present in the original schema (single-session-per-user) and
 * must be removed to allow multiple sessions per user.
 */
async function migrateAiSessions(): Promise<void> {
  try {
    const col = mongoose.connection.collection('aisessions')
    const indexes = await col.indexes()
    const hasOldIndex = indexes.some(
      (idx) => idx.key && idx.key['userId'] === 1 && idx.unique === true,
    )
    if (hasOldIndex) {
      await col.dropIndex('userId_1')
      logger.info('Migrated: dropped unique index on aisessions.userId')
    }
  } catch (err) {
    // Non-fatal — log and continue
    logger.warn({ err }, 'Migration: could not drop aisessions userId index')
  }
}

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true)

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'))
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'))

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45_000,
  })

  await migrateAiSessions()
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
}
