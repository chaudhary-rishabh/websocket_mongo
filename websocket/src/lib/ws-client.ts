import type { ClientEvent, ServerEvent } from './chat-types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000'

type EventHandler = (event: ServerEvent) => void

class WSClient {
  private socket: WebSocket | null = null
  private token: string | null = null
  private handlers: Set<EventHandler> = new Set()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private maxDelay = 30_000
  private shouldReconnect = false
  private pingInterval: ReturnType<typeof setInterval> | null = null

  connect(token: string): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.token === token) return
    this.token = token
    this.shouldReconnect = true
    this.reconnectDelay = 1000
    this.openSocket()
  }

  disconnect(): void {
    this.shouldReconnect = false
    this.clearTimers()
    this.socket?.close(1000, 'Client disconnect')
    this.socket = null
  }

  send(event: ClientEvent): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event))
    }
  }

  on(handler: EventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  private openSocket(): void {
    if (!this.token) return
    const url = `${WS_URL}/ws?token=${encodeURIComponent(this.token)}`
    try {
      this.socket = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      this.reconnectDelay = 1000
      this.startPing()
    }

    this.socket.onmessage = (ev: MessageEvent) => {
      try {
        const event = JSON.parse(ev.data as string) as ServerEvent
        this.handlers.forEach((h) => h(event))
      } catch {
      }
    }

    this.socket.onclose = () => {
      this.clearTimers()
      if (this.shouldReconnect) this.scheduleReconnect()
    }

    this.socket.onerror = () => {
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'PING' })
    }, 25_000)
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay)
      this.openSocket()
    }, this.reconnectDelay)
  }

  private clearTimers(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null }
  }
}

export const wsClient = new WSClient()
