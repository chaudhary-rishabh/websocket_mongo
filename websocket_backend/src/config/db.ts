import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../shared/utils/logger.js'

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true)

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'))
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'))

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45_000,
  })
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
}
