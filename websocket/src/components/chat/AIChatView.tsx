'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Menu, Search, X, ChevronRight, UserSearch, UserRound } from 'lucide-react'
import { useChatStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import MessageInput from './MessageInput'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
}

interface SearchUser {
  _id: string
  displayName: string
  username: string
  avatar?: string
}

// ─── SSE stream reader — shared by chat and analyze ──────────────────────────
async function readStream(
  response: Response,
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>,
) {
  if (!response.body) throw new Error('No body')
  const reader  = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload) as { content?: string; error?: string }
        if (json.error) throw new Error(json.error)
        if (json.content) {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: m.content + json.content } : m),
          )
        }
      } catch {/* skip malformed chunks */}
    }
  }
}

export default function AIChatView() {
  const { data: session } = useSession()
  const { toggleSidebar } = useChatStore()

  const [messages,    setMessages]    = useState<AiMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  // ── User-analyse panel state ──────────────────────────────────────────────
  const [analyzeOpen,   setAnalyzeOpen]   = useState(false)
  const [userSearchQ,   setUserSearchQ]   = useState('')
  const [userResults,   setUserResults]   = useState<SearchUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── User search (debounced) ───────────────────────────────────────────────
  useEffect(() => {
    if (!analyzeOpen || !session?.accessToken) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const r = await fetch(
          `${API}/api/v1/users/search?q=${encodeURIComponent(userSearchQ)}`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        )
        const json = await r.json()
        if (json.success) setUserResults(json.data.items ?? [])
      } catch {/* ignore */}
      finally { setSearchLoading(false) }
    }, 300)

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [userSearchQ, analyzeOpen, session?.accessToken])

  // ── Core stream helper ────────────────────────────────────────────────────
  const runStream = useCallback(async (
    userLabel: string,
    fetchFn: () => Promise<Response>,
  ) => {
    if (isStreaming) return
    setAnalyzeOpen(false)

    const userMsg: AiMessage  = { id: crypto.randomUUID(), role: 'user',      content: userLabel }
    const assistantId         = crypto.randomUUID()
    const assistantMsg: AiMessage = { id: assistantId, role: 'assistant', content: '', streaming: true }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setIsStreaming(true)

    try {
      const response = await fetchFn()
      if (!response.ok) throw new Error('Bad response')
      await readStream(response, assistantId, setMessages)
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Something went wrong. Please try again.', error: true }
            : m,
        ),
      )
    } finally {
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m))
      setIsStreaming(false)
    }
  }, [isStreaming])

  // ── Normal chat send ──────────────────────────────────────────────────────
  const handleSend = useCallback(async (userContent: string) => {
    if (isStreaming || !session?.accessToken) return

    const history = [...messages].map(({ role, content }) => ({ role, content }))

    await runStream(userContent, () =>
      fetch(`${API}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: userContent }] }),
      }),
    )
  }, [isStreaming, session?.accessToken, messages, runStream])

  // ── Analyse a user (or self) ──────────────────────────────────────────────
  const handleAnalyze = useCallback(async (userId: string, displayName: string) => {
    if (!session?.accessToken) return
    const isSelf = userId === 'me'
    const label  = isSelf ? '📊 Analyse my own behaviour & emotions' : `📊 Analyse ${displayName}'s messages`

    await runStream(label, () =>
      fetch(`${API}/api/v1/ai/analyze-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ userId }),
      }),
    )
  }, [session?.accessToken, runStream])

  return (
    <div className="relative flex flex-col h-full overflow-hidden">

      {/* ── Floating header ── */}
      <div className="absolute inset-x-0 top-0 z-10 rounded-t-[25px] overflow-hidden">
        <header className="flex items-center gap-3 px-5 py-3.5 header-glass flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#2A1F14]">AI Assistant</h1>
            <p className="text-xs text-[#9A8474]">Powered by DeepSeek</p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#9A8474] bg-[#EDE4D6] px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-[#C4B4A0]'}`} />
            {isStreaming ? 'Thinking…' : 'Ready'}
          </div>
        </header>
      </div>

      {/* ── Messages ── */}
      <div className="flex flex-col flex-1 overflow-hidden pt-[68px]">
        <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-3">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-[#2A1F14]">AI Assistant</p>
                <p className="text-sm text-[#9A8474] mt-1.5 leading-relaxed max-w-xs">
                  Ask me anything, or let me analyse your personality and emotions from your chat history.
                </p>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['Explain a concept', 'Write some code', 'Give me ideas'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => handleSend(hint)}
                    disabled={isStreaming}
                    className="text-xs text-[#7C5C3E] bg-[#EDE4D6] hover:bg-[#E4D5C2] px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {hint}
                  </button>
                ))}
              </div>

              {/* Analyse section */}
              <div className="w-full max-w-xs flex flex-col gap-2 mt-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9A8474]">
                  Insights from your chat history
                </p>

                {/* Analyse myself */}
                <button
                  onClick={() => handleAnalyze('me', 'myself')}
                  disabled={isStreaming}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#2D2D2D] transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <UserRound className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">How am I feeling?</p>
                    <p className="text-[10px] text-white/50 mt-0.5">Analyse my own behaviour & emotions</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                </button>

                {/* Analyse a user */}
                <button
                  onClick={() => { setAnalyzeOpen(true); setUserSearchQ(''); setUserResults([]) }}
                  disabled={isStreaming}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#E0D5C5] hover:bg-[#EDE4D6] transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#EDE4D6] flex items-center justify-center flex-shrink-0">
                    <UserSearch className="w-4 h-4 text-[#7C5C3E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#2A1F14]">Analyse someone else</p>
                    <p className="text-[10px] text-[#9A8474] mt-0.5">Pick a user from your conversations</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C4B4A0] flex-shrink-0" />
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => <AiBubble key={msg.id} message={msg} />)}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── User-analyse picker (slides up from bottom) ── */}
      <AnimatePresence>
        {analyzeOpen && (
          <>
            <motion.div
              key="analyze-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/20 z-20 rounded-[25px]"
              onClick={() => setAnalyzeOpen(false)}
            />
            <motion.div
              key="analyze-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
              className="absolute bottom-0 inset-x-0 z-30 bg-[#F6EEE3] rounded-t-[25px] border-t border-[#E0D5C5] shadow-2xl flex flex-col"
              style={{ maxHeight: '60%' }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <div>
                  <p className="text-sm font-bold text-[#2A1F14]">Analyse a User</p>
                  <p className="text-xs text-[#9A8474] mt-0.5">
                    Search from your conversations
                  </p>
                </div>
                <button
                  onClick={() => setAnalyzeOpen(false)}
                  className="p-2 rounded-full hover:bg-[#EDE4D6] transition-colors text-[#9A8474]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="px-5 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2 bg-white/70 border border-[#E0D5C5] rounded-2xl px-3 py-2">
                  <Search className="w-4 h-4 text-[#9A8474] flex-shrink-0" />
                  <input
                    autoFocus
                    value={userSearchQ}
                    onChange={(e) => setUserSearchQ(e.target.value)}
                    placeholder="Search by name or username…"
                    className="flex-1 text-sm bg-transparent outline-none text-[#2A1F14] placeholder-[#B0A090]"
                  />
                </div>
              </div>

              <div className="h-px bg-[#E0D5C5] mx-5 flex-shrink-0" />

              {/* Results */}
              <div className="overflow-y-auto chat-scrollbar flex-1 py-2">
                {searchLoading && (
                  <p className="text-center text-xs text-[#B0A090] py-6">Searching…</p>
                )}
                {!searchLoading && userResults.length === 0 && (
                  <p className="text-center text-xs text-[#B0A090] py-6">
                    {userSearchQ ? 'No users found' : 'Start typing to search'}
                  </p>
                )}
                {!searchLoading && userResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleAnalyze(u._id, u.displayName)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#EDE4D6] transition-colors text-left"
                  >
                    <Avatar
                      src={u.avatar}
                      initials={u.displayName.slice(0, 2).toUpperCase()}
                      name={u.displayName}
                      id={u._id}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2A1F14] truncate">{u.displayName}</p>
                      <p className="text-xs text-[#9A8474]">@{u.username}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#C4B4A0] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Input ── */}
      <MessageInput onSend={handleSend} onTypingStart={() => {}} onTypingStop={() => {}} />
    </div>
  )
}

/* ── Single message bubble ──────────────────────────────────────────────────── */
function AiBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#EDE0CB] text-[#2A1F14] rounded-2xl rounded-br-sm'
            : message.error
              ? 'bg-red-50 text-red-600 border border-red-200 rounded-2xl rounded-bl-sm'
              : 'bg-white text-[#2A1F14] border border-[#E0D5C5] rounded-2xl rounded-bl-sm'
        }`}
      >
        <span className="whitespace-pre-wrap break-words">{message.content}</span>
        {message.streaming && (
          <span className="inline-block w-[2px] h-[14px] bg-[#9A8474] ml-0.5 align-middle animate-pulse rounded-full" />
        )}
      </div>

      {isUser && <div className="w-7 flex-shrink-0" />}
    </motion.div>
  )
}
