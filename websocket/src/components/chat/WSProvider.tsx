'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { wsClient } from '@/lib/ws-client'
import { useChatStore } from '@/lib/store'
import type { ApiMessage, ServerEvent } from '@/lib/chat-types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function WSProvider() {
  const { data: session } = useSession()
  const {
    setWsConnected,
    appendMessage,
    replaceTempMessage,
    setTyping,
    setUserOnline,
    setUserOffline,
    setRealConversations,
  } = useChatStore()

  // Load real conversations from API
  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`${API}/api/v1/conversations`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setRealConversations(json.data)
        }
      })
      .catch(() => {/* ignore */})
  }, [session?.accessToken, setRealConversations])

  // Connect / disconnect WS
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
          break
        }

        case 'TYPING':
          setTyping(event.conversationId, event.userId, event.username, true)
          break

        case 'STOP_TYPING':
          setTyping(event.conversationId, event.userId, '', false)
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
  }, [session?.accessToken, setWsConnected, appendMessage, replaceTempMessage, setTyping, setUserOnline, setUserOffline])

  return null
}
