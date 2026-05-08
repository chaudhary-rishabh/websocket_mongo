import mongoose, { type Document, type Model, Schema } from 'mongoose'

/**
 * AiMessage — every turn in an AI conversation.
 *
 * type: 'chat'     → normal free-form AI chat message
 *       'analysis' → a personality / behaviour analysis request + response
 *
 * metadata is populated only for 'analysis' messages so the UI can render
 * a contextual label ("You asked about <name>") without parsing the content.
 */
export interface IAiMessage extends Document {
  _id: mongoose.Types.ObjectId
  sessionId: mongoose.Types.ObjectId   // ref: AiSession  (the user's AI thread)
  userId:    mongoose.Types.ObjectId   // ref: User        (denormalised for direct queries)
  role:      'user' | 'assistant'
  content:   string
  type:      'chat' | 'analysis'
  metadata?: {
    model?:              string   // e.g. 'deepseek-chat'
    analyzedUserId?:     string   // who was analysed
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
    timestamps: { createdAt: true, updatedAt: false }, // messages are immutable
  },
)

// Primary query pattern: all messages for a session in date order
aiMessageSchema.index({ sessionId: 1, createdAt: 1 })

export const AiMessage: Model<IAiMessage> =
  mongoose.model<IAiMessage>('AiMessage', aiMessageSchema)
