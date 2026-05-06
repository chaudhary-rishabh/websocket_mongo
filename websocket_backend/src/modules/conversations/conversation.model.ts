import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId
  type: 'dm' | 'group'
  name?: string
  avatar?: string
  members: mongoose.Types.ObjectId[]
  admins: mongoose.Types.ObjectId[]
  lastMessage?: {
    content: string
    senderId: mongoose.Types.ObjectId
    type: 'text' | 'image' | 'voice' | 'file'
    timestamp: Date
  }
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const conversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['dm', 'group'], required: true },
    name: { type: String, trim: true, maxlength: 80 },
    avatar: { type: String },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: {
      content: String,
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      type: { type: String, enum: ['text', 'image', 'voice', 'file'] },
      timestamp: Date,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

conversationSchema.index({ members: 1 })
conversationSchema.index({ updatedAt: -1 })

export const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema,
)
