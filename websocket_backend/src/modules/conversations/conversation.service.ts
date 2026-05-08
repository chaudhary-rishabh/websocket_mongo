import mongoose from 'mongoose'
import { Conversation } from './conversation.model.js'
import { AppError } from '../../middleware/error.js'
import type {
  CreateConversationInput,
  UpdateConversationInput,
  AddMembersInput,
} from './conversation.schemas.js'

export async function listConversations(userId: string) {
  return Conversation.find({ members: userId })
    .populate('members', 'username displayName avatar isOnline lastSeen')
    .sort({ updatedAt: -1 })
    .lean()
}

export async function createConversation(input: CreateConversationInput, creatorId: string) {
  const allMembers = [...new Set([...input.members, creatorId])]

  if (input.type === 'dm') {
    if (allMembers.length !== 2) {
      throw new AppError('INVALID_REQUEST', 'DM requires exactly 2 members', 400)
    }
    const existing = await Conversation.findOne({
      type: 'dm',
      members: { $all: allMembers, $size: 2 },
    })
    if (existing) return existing
  }

  return Conversation.create({
    type: input.type,
    ...(input.name !== undefined && { name: input.name }),
    members: allMembers.map((id) => new mongoose.Types.ObjectId(id)),
    admins: [new mongoose.Types.ObjectId(creatorId)],
    createdBy: new mongoose.Types.ObjectId(creatorId),
  })
}

export async function getConversation(conversationId: string, userId: string) {
  const conv = await Conversation.findById(conversationId)
    .populate('members', 'username displayName avatar isOnline lastSeen')
    .lean()

  if (!conv) throw AppError.notFound('Conversation')

  const isMember = conv.members.some((m) => {
    const memberId = typeof m === 'object' && '_id' in m ? (m as { _id: mongoose.Types.ObjectId })._id : m
    return memberId.toString() === userId
  })
  if (!isMember) throw AppError.forbidden('You are not a member of this conversation')

  return conv
}

export async function updateConversation(
  conversationId: string,
  userId: string,
  input: UpdateConversationInput,
) {
  const conv = await Conversation.findById(conversationId)
  if (!conv) throw AppError.notFound('Conversation')
  if (!conv.admins.some((id) => id.toString() === userId)) {
    throw AppError.forbidden('Only admins can update this group')
  }
  Object.assign(conv, input)
  return conv.save()
}

export async function addMembers(conversationId: string, userId: string, input: AddMembersInput) {
  const conv = await Conversation.findById(conversationId)
  if (!conv) throw AppError.notFound('Conversation')
  if (conv.type !== 'group') throw new AppError('INVALID_REQUEST', 'Cannot add members to a DM', 400)
  if (!conv.admins.some((id) => id.toString() === userId)) {
    throw AppError.forbidden('Only admins can add members')
  }
  const newIds = input.userIds
    .filter((id) => !conv.members.some((m) => m.toString() === id))
    .map((id) => new mongoose.Types.ObjectId(id))
  conv.members.push(...newIds)
  return conv.save()
}

export async function removeMember(conversationId: string, adminId: string, targetUserId: string): Promise<void> {
  const conv = await Conversation.findById(conversationId)
  if (!conv) throw AppError.notFound('Conversation')
  if (conv.type !== 'group') throw new AppError('INVALID_REQUEST', 'Cannot remove members from a DM', 400)
  if (!conv.admins.some((id) => id.toString() === adminId)) {
    throw AppError.forbidden('Only admins can remove members')
  }
  if (targetUserId === adminId) throw new AppError('INVALID_REQUEST', 'Use leave to remove yourself', 400)
  conv.members = conv.members.filter((id) => id.toString() !== targetUserId)
  conv.admins  = conv.admins.filter((id)  => id.toString() !== targetUserId)
  await conv.save()
}

export async function leaveConversation(conversationId: string, userId: string): Promise<void> {
  const conv = await Conversation.findById(conversationId)
  if (!conv) throw AppError.notFound('Conversation')
  conv.members = conv.members.filter((id) => id.toString() !== userId)
  conv.admins = conv.admins.filter((id) => id.toString() !== userId)
  if (conv.members.length === 0) {
    await Conversation.findByIdAndDelete(conversationId)
  } else {
    if (conv.admins.length === 0 && conv.members[0]) {
      conv.admins.push(conv.members[0])
    }
    await conv.save()
  }
}
