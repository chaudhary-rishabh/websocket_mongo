import mongoose, { type Document, type Model, Schema } from 'mongoose'

/**
 * AiSession — one chat thread in the AI assistant.
 * Users can have multiple sessions ("New Chat" creates a new one).
 *
 * MIGRATION NOTE: If you had the old single-session-per-user schema, drop the
 * unique index before starting the server:
 *   db.aisessions.dropIndex("userId_1")
 */
export interface IAiSession extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId   // ref: User
  title?: string                    // auto-set from first user message (max 80 chars)
  messageCount: number
  lastActivityAt: Date
  createdAt: Date
  updatedAt: Date
}

const aiSessionSchema = new Schema<IAiSession>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:          { type: String, maxlength: 80 },
    messageCount:   { type: Number, default: 0 },
    lastActivityAt: { type: Date,   default: Date.now },
  },
  { timestamps: true },
)

export const AiSession: Model<IAiSession> =
  mongoose.model<IAiSession>('AiSession', aiSessionSchema)
