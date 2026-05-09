import type { Request } from 'express'
import type { JWTPayload } from 'jose'

export interface AuthPayload extends JWTPayload {
  sub: string
  email: string
  username: string
  role: 'user' | 'admin'
}

export interface AuthRequest extends Request {
  user: AuthPayload
  requestId: string
}

export type ConversationType = 'dm' | 'group'
export type MessageType = 'text' | 'image' | 'voice' | 'file'
export type MessageStatus = 'sent' | 'delivered' | 'read'
export type UserRole = 'user' | 'admin'

export interface PaginationQuery {
  page?: number
  limit?: number
  cursor?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  nextCursor?: string
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
