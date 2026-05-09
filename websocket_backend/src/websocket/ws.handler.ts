import type { AuthenticatedSocket, ClientEvent, ServerEvent } from './ws.types.js'
import {
  joinRoom,
  leaveRoom,
  broadcastToRoom,
  broadcastToRoomAll,
  sendToUser,
  isUserOnline,
} from './ws.rooms.js'
import { sendMessage, addReaction, markRead } from '../modules/messages/message.service.js'
import { setOnlineStatus } from '../modules/users/user.service.js'
import { listConversations } from '../modules/conversations/conversation.service.js'
import { logger } from '../shared/utils/logger.js'

function send(socket: AuthenticatedSocket, event: ServerEvent): void {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(event))
  }
}

function sendError(socket: AuthenticatedSocket, code: string, message: string): void {
  send(socket, { type: 'ERROR', code, message })
}

export async function handleMessage(socket: AuthenticatedSocket, raw: string): Promise<void> {
  let event: ClientEvent

  try {
    event = JSON.parse(raw) as ClientEvent
  } catch {
    sendError(socket, 'PARSE_ERROR', 'Invalid JSON')
    return
  }

  try {
    switch (event.type) {
      case 'PING':
        send(socket, { type: 'PONG' })
        break

      case 'JOIN_CONVERSATION':
        joinRoom(event.conversationId, socket)
        break

      case 'LEAVE_CONVERSATION':
        leaveRoom(event.conversationId, socket)
        break

      case 'SEND_MESSAGE': {
        const msg = await sendMessage(event.conversationId, socket.userId, {
          type: event.messageType,
          content: event.content,
          ...(event.mediaUrl && { mediaUrl: event.mediaUrl }),
          ...(event.replyTo && { replyTo: event.replyTo }),
        })
        const msgObj =
(msg as any).toObject?.() as Record<string, unknown> ?? (msg as unknown as Record<string, unknown>)
        broadcastToRoomAll(event.conversationId, {
          type: 'NEW_MESSAGE',
          message: msgObj,
          tempId: event.tempId,
        })
        break
      }

      case 'TYPING_START':
        broadcastToRoom(
          event.conversationId,
          { type: 'TYPING', conversationId: event.conversationId, userId: socket.userId, username: socket.user.username },
          socket,
        )
        break

      case 'TYPING_STOP':
        broadcastToRoom(
          event.conversationId,
          { type: 'STOP_TYPING', conversationId: event.conversationId, userId: socket.userId },
          socket,
        )
        break

      case 'MARK_READ': {
        await markRead(event.conversationId, socket.userId)
        broadcastToRoom(
          event.conversationId,
          { type: 'MESSAGES_READ', conversationId: event.conversationId, userId: socket.userId, readAt: new Date().toISOString() },
          socket,
        )
        break
      }

      case 'ADD_REACTION': {
        const msg = await addReaction(event.messageId, socket.userId, { emoji: event.emoji })
        const msgObj =
(msg as any).toObject?.() as Record<string, unknown> ?? (msg as unknown as Record<string, unknown>)
        broadcastToRoomAll(event.conversationId, { type: 'REACTION_UPDATED', message: msgObj })
        break
      }

      default:
        sendError(socket, 'UNKNOWN_EVENT', 'Unknown event type')
    }
  } catch (err) {
    logger.error({ err, userId: socket.userId }, 'WS handler error')
    sendError(socket, 'SERVER_ERROR', 'An error occurred')
  }
}

export async function handleConnect(socket: AuthenticatedSocket): Promise<void> {
  await setOnlineStatus(socket.userId, true)
  send(socket, { type: 'CONNECTED', userId: socket.userId })

  try {
    const conversations = await listConversations(socket.userId)
    for (const conv of conversations) {
      const convId = conv._id?.toString()
      if (!convId) continue
      joinRoom(convId, socket)
      broadcastToRoom(convId, {
        type: 'USER_ONLINE',
        userId: socket.userId,
      }, socket)
    }
  } catch (err) {
    logger.error({ err, userId: socket.userId }, 'Failed to auto-join rooms on connect')
  }

  logger.info({ userId: socket.userId }, 'WS client connected')
}

export async function handleDisconnect(socket: AuthenticatedSocket, roomIds: string[]): Promise<void> {
  if (!isUserOnline(socket.userId)) {
    await setOnlineStatus(socket.userId, false)
  }
  const lastSeen = new Date().toISOString()
  for (const convId of roomIds) {
    broadcastToRoom(convId, {
      type: 'USER_OFFLINE',
      userId: socket.userId,
      lastSeen,
    }, socket)
  }
  logger.info({ userId: socket.userId }, 'WS client disconnected')
}
