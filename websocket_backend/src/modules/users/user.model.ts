import mongoose, { type Document, type Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  username: string
  displayName: string
  passwordHash: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  isOnline: boolean
  lastSeen: Date
  refreshTokenHash?: string
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String },
    bio: { type: String, maxlength: 300 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    refreshTokenHash: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['passwordHash']
        delete ret['refreshTokenHash']
        return ret
      },
    },
  },
)

userSchema.methods['comparePassword'] = async function (this: IUser, candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash)
}

userSchema.index({ email: 1 })
userSchema.index({ username: 1 })

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)
