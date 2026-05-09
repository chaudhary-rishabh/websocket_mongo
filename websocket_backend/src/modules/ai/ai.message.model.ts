import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IAiMessage extends Document {
  _id: mongoose.Types.ObjectId
  sessionId: mongoose.Types.ObjectId
  userId:    mongoose.Types.ObjectId
  role:      'user' | 'assistant'
  content:   string
  type:      'chat' | 'analysis'
  metadata?: {
    model?:              string
    analyzedUserId?:     string
    analyzedUserName?:   string
  }
  createdAt: Date
}

const aiMessageSchema = new Schema<IAiMessage>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'AiSession', required: true, index: true },
    userId:    { type: Schema.Types.ObjectId, ref: 'User',      required: true, index: true },
    role:      { type: String, enum: ['user', 'assistant'], required: true },
    content:   { type: String, required: true, maxlength: 50_000 },
    type:      { type: String, enum: ['chat', 'analysis'], required: true, default: 'chat' },
    metadata: {
      model:            { type: String },
      analyzedUserId:   { type: String },
      analyzedUserName: { type: String },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

aiMessageSchema.index({ sessionId: 1, createdAt: 1 })

export const AiMessage: Model<IAiMessage> =
  mongoose.model<IAiMessage>('AiMessage', aiMessageSchema)
