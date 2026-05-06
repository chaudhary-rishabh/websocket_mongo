import mongoose from 'mongoose'
import { Message } from './message.model.js'
import { Conversation } from '../conversations/conversation.model.js'
import { AppError } from '../../middleware/error.js'
import type { SendMessageInput, EditMessageInput, ReactInput, MessageQuery } from './message.schemas.js'

async function assertMember(conversationId: string, userId: string): Promise<void> {
  const conv = await Conversation.findById(conversationId).select('members').lean()
  if (!conv) throw AppError.notFound('Conversation')
  const isMember = conv.members.some((id) => id.toString() === userId)
  if (!isMember) throw AppError.forbidden('You are not a member of this conversation')
}

export async function listMessages(conversationId: string, userId: string, query: MessageQuery) {
  await assertMember(conversationId, userId)

  const filter: Record<string, unknown> = {
    conversationId,
    deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
  }

  if (query.cursor) {
    filter['_id'] = { $lt: new mongoose.Types.ObjectId(query.cursor) }
  }

  const messages = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(query.limit)
    .populate('senderId', 'username displayName avatar')
    .lean()

  const items = messages.reverse()
  const nextCursor = messages.length === query.limit ? String(messages[0]?._id) : undefined

  return { items, hasMore: !!nextCursor, nextCursor }
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  input: SendMessageInput,
) {
  await assertMember(conversationId, userId)

  const message = await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    senderId: new mongoose.Types.ObjectId(userId),
    type: input.type,
    content: input.content,
    ...(input.mediaUrl !== undefined && { mediaUrl: input.mediaUrl }),
    ...(input.replyTo !== undefined && { replyTo: new mongoose.Types.ObjectId(input.replyTo) }),
  })

  await Conversation.findByIdAndUpdate(conversationId, {
    $set: {
      lastMessage: {
        content: input.content,
        senderId: new mongoose.Types.ObjectId(userId),
        type: input.type,
        timestamp: new Date(),
      },
      updatedAt: new Date(),
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (message as any).populate('senderId', 'username displayName avatar')
}

export async function editMessage(messageId: string, userId: string, input: EditMessageInput) {
  const msg = await Message.findById(messageId)
  if (!msg) throw AppError.notFound('Message')
  if (msg.senderId.toString() !== userId) throw AppError.forbidden('Cannot edit another user\'s message')
  if (msg.type !== 'text') throw new AppError('INVALID_REQUEST', 'Only text messages can be edited', 400)

  msg.content = input.content
  msg.editedAt = new Date()
  return msg.save()
}

export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const msg = await Message.findById(messageId)
  if (!msg) throw AppError.notFound('Message')
  if (msg.senderId.toString() !== userId) {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: new mongoose.Types.ObjectId(userId) },
    })
  } else {
    await Message.findByIdAndDelete(messageId)
  }
}

export async function addReaction(messageId: string, userId: string, input: ReactInput) {
  const msg = await Message.findById(messageId)
  if (!msg) throw AppError.notFound('Message')

  const uid = new mongoose.Types.ObjectId(userId)
  const existingIdx = msg.reactions.findIndex(
    (r) => r.userId.toString() === userId && r.emoji === input.emoji,
  )

  if (existingIdx >= 0) {
    msg.reactions.splice(existingIdx, 1)
  } else {
    msg.reactions.push({ userId: uid, emoji: input.emoji })
  }

  return msg.save()
}

export async function markRead(conversationId: string, userId: string): Promise<void> {
  const uid = new mongoose.Types.ObjectId(userId)
  await Message.updateMany(
    {
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: { $ne: uid },
      'readBy.userId': { $ne: uid },
    },
    { $addToSet: { readBy: { userId: uid, readAt: new Date() } } },
  )
}
