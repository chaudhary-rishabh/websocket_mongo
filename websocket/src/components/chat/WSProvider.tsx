'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'
import { wsClient } from '@/lib/ws-client'
import { useChatStore } from '@/lib/store'
import { setAuth, clearAuth, authFetch } from '@/lib/api'
import type { ApiMessage, ServerEvent } from '@/lib/chat-types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function WSProvider() {
  const { data: session, update } = useSession()
  const {
    setWsConnected,
    appendMessage,
    replaceTempMessage,
    setTyping,
    setUserOnline,
    setUserOffline,
    setRealConversations,
    markMessagesRead,
    updateMessage,
    updateConversationLastMessage,
  } = useChatStore()

  useEffect(() => {
    if (!session?.accessToken || !session?.refreshToken) return

    if (session.error === 'RefreshAccessTokenError') {
      void signOut({ callbackUrl: '/login' })
      return
    }

    setAuth({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      onRefreshed: async (tokens) => {
        await update(tokens)
      },
    })

    return () => {
      clearAuth()
    }
  }, [session?.accessToken, session?.refreshToken, session?.error, update])

  useEffect(() => {
    if (!session?.accessToken) return
    authFetch(`${API}/api/v1/conversations`, {}, session.accessToken)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setRealConversations(json.data)
        }
      })
      .catch(() => { toast.error('Failed to load conversations') })
  }, [session?.accessToken, setRealConversations])

  useEffect(() => {
    if (!session?.accessToken) return

    wsClient.connect(session.accessToken)

    const off = wsClient.on((event: ServerEvent) => {
      switch (event.type) {
        case 'CONNECTED':
          setWsConnected(true)
          break

        case 'NEW_MESSAGE': {
          const msg = event.message as ApiMessage
          const convId = msg.conversationId
          if (event.tempId) {
            replaceTempMessage(convId, event.tempId, msg)
          } else {
            appendMessage(convId, msg)
          }
          updateConversationLastMessage(convId, msg)
          break
        }

        case 'TYPING':
          setTyping(event.conversationId, event.userId, event.username, true)
          break

        case 'STOP_TYPING':
          setTyping(event.conversationId, event.userId, '', false)
          break

        case 'MESSAGES_READ':
          markMessagesRead(event.conversationId, event.userId, event.readAt)
          break

        case 'REACTION_UPDATED':
          updateMessage(event.message.conversationId, event.message)
          break

        case 'USER_ONLINE':
          setUserOnline(event.userId)
          break

        case 'USER_OFFLINE':
          setUserOffline(event.userId)
          break
      }
    })

    return () => {
      off()
      wsClient.disconnect()
      setWsConnected(false)
    }
  }, [session?.accessToken, setWsConnected, appendMessage, replaceTempMessage, setTyping, setUserOnline, setUserOffline, markMessagesRead, updateMessage, updateConversationLastMessage])

  return null
}
