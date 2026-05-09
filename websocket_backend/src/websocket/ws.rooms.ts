import type { AuthenticatedSocket } from './ws.types.js'

const rooms = new Map<string, Set<AuthenticatedSocket>>()

const userSockets = new Map<string, Set<AuthenticatedSocket>>()

export function joinRoom(conversationId: string, socket: AuthenticatedSocket): void {
  if (!rooms.has(conversationId)) rooms.set(conversationId, new Set())
  rooms.get(conversationId)!.add(socket)
}

export function leaveRoom(conversationId: string, socket: AuthenticatedSocket): void {
  rooms.get(conversationId)?.delete(socket)
  if (rooms.get(conversationId)?.size === 0) rooms.delete(conversationId)
}

export function leaveAllRooms(socket: AuthenticatedSocket): void {
  for (const [id, sockets] of rooms) {
    sockets.delete(socket)
    if (sockets.size === 0) rooms.delete(id)
  }
}

export function broadcastToRoom(
  conversationId: string,
  payload: Record<string, unknown>,
  excludeSocket?: AuthenticatedSocket,
): void {
  const sockets = rooms.get(conversationId)
  if (!sockets) return
  const msg = JSON.stringify(payload)
  for (const sock of sockets) {
    if (sock !== excludeSocket && sock.readyState === 1) {
      sock.send(msg)
    }
  }
}

export function broadcastToRoomAll(conversationId: string, payload: Record<string, unknown>): void {
  broadcastToRoom(conversationId, payload, undefined)
}

export function registerUserSocket(userId: string, socket: AuthenticatedSocket): void {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set())
  userSockets.get(userId)!.add(socket)
}

export function unregisterUserSocket(userId: string, socket: AuthenticatedSocket): void {
  userSockets.get(userId)?.delete(socket)
  if (userSockets.get(userId)?.size === 0) userSockets.delete(userId)
}

export function sendToUser(userId: string, payload: Record<string, unknown>): void {
  const sockets = userSockets.get(userId)
  if (!sockets) return
  const msg = JSON.stringify(payload)
  for (const sock of sockets) {
    if (sock.readyState === 1) sock.send(msg)
  }
}

export function isUserOnline(userId: string): boolean {
  const sockets = userSockets.get(userId)
  return !!(sockets && sockets.size > 0)
}

export function getRoomSize(conversationId: string): number {
  return rooms.get(conversationId)?.size ?? 0
}

export function getSocketRooms(socket: AuthenticatedSocket): string[] {
  const result: string[] = []
  for (const [id, sockets] of rooms) {
    if (sockets.has(socket)) result.push(id)
  }
  return result
}
