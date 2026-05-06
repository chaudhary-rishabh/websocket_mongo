import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  senderId: mongoose.Types.ObjectId
  type: 'text' | 'image' | 'voice' | 'file'
  content: string
  mediaUrl?: string
  mediaMeta?: {
    originalName?: string
    mimeType?: string
    size?: number
    duration?: number
    width?: number
    height?: number
  }
  reactions: Array<{ userId: mongoose.Types.ObjectId; emoji: string }>
  readBy: Array<{ userId: mongoose.Types.ObjectId; readAt: Date }>
  deliveredTo: Array<{ userId: mongoose.Types.ObjectId; deliveredAt: Date }>
  replyTo?: mongoose.Types.ObjectId
  deletedFor: mongoose.Types.ObjectId[]
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'image', 'voice', 'file'], required: true },
    content: { type: String, required: true, maxlength: 10_000 },
    mediaUrl: { type: String },
    mediaMeta: {
      originalName: String,
      mimeType: String,
      size: Number,
      duration: Number,
      width: Number,
      height: Number,
    },
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, maxlength: 8 },
      },
    ],
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    editedAt: { type: Date },
  },
  { timestamps: true },
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema)
