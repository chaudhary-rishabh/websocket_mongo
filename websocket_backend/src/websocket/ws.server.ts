import { WebSocketServer, type WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { Server } from 'http'
import { jwtVerify } from 'jose'
import { getPublicKey } from '../config/jwt.js'
import type { AuthenticatedSocket } from './ws.types.js'
import type { AuthPayload } from '../shared/types/index.js'
import {
  registerUserSocket,
  unregisterUserSocket,
  leaveAllRooms,
  getSocketRooms,
} from './ws.rooms.js'
import { handleMessage, handleConnect, handleDisconnect } from './ws.handler.js'
import { logger } from '../shared/utils/logger.js'

export function createWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  // Heartbeat — detect stale connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((rawSocket) => {
      const socket = rawSocket as AuthenticatedSocket
      if (!socket.isAlive) {
        socket.terminate()
        return
      }
      socket.isAlive = false
      socket.ping()
    })
  }, 30_000)

  wss.on('close', () => clearInterval(heartbeatInterval))

  wss.on('connection', async (rawSocket: WebSocket, req: IncomingMessage) => {
    const socket = rawSocket as AuthenticatedSocket
    socket.isAlive = true

    // ── Auth via query token ─────────────────────────────────────────────
    const url = new URL(req.url ?? '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      socket.send(JSON.stringify({ type: 'ERROR', code: 'UNAUTHORIZED', message: 'Missing token' }))
      socket.close(1008, 'Missing token')
      return
    }

    try {
      const { payload } = await jwtVerify<AuthPayload>(token, getPublicKey(), {
        algorithms: ['RS256'],
      })
      socket.user = payload
      socket.userId = payload.sub
    } catch {
      socket.send(JSON.stringify({ type: 'ERROR', code: 'UNAUTHORIZED', message: 'Invalid token' }))
      socket.close(1008, 'Invalid token')
      return
    }

    registerUserSocket(socket.userId, socket)
    await handleConnect(socket)

    socket.on('pong', () => { socket.isAlive = true })

    socket.on('message', (data) => {
      handleMessage(socket, data.toString()).catch((err: unknown) => {
        logger.error({ err }, 'Unhandled WS message error')
      })
    })

    socket.on('close', () => {
      const roomIds = getSocketRooms(socket)
      unregisterUserSocket(socket.userId, socket)
      leaveAllRooms(socket)
      handleDisconnect(socket, roomIds).catch((err: unknown) => {
        logger.error({ err }, 'WS disconnect error')
      })
    })

    socket.on('error', (err) => {
      logger.error({ err, userId: socket.userId }, 'WS socket error')
    })
  })

  logger.info('WebSocket server initialized at /ws')
  return wss
}
