import mongoose, { type Document, Schema } from 'mongoose'

export interface IStory extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  mediaUrl: string
  mediaType: 'image'
  caption?: string
  viewers: Array<{ userId: mongoose.Types.ObjectId; viewedAt: Date }>
  createdAt: Date
  updatedAt: Date
}

const storySchema = new Schema<IStory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image'], default: 'image' },
    caption: { type: String, maxlength: 200 },
    viewers: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
)

storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 })

storySchema.index({ userId: 1, createdAt: -1 })

export const Story = mongoose.model<IStory>('Story', storySchema)
