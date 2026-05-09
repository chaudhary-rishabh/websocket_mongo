import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IAiSession extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title?: string
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
