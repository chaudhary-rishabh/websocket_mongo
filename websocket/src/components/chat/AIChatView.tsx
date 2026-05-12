'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Menu, Search, X, ChevronRight, UserSearch, UserRound,
  PanelLeftClose, PanelLeftOpen, SquarePen, Trash2,
} from 'lucide-react'
import { useChatStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import MessageInput from './MessageInput'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface AiSessionSummary {
  _id: string
  title?: string
  messageCount: number
  lastActivityAt: string
  createdAt: string
}

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
      } catch {/* skip malformed */}
    }
  }
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function groupSessions(sessions: AiSessionSummary[]) {
  const todayStr     = new Date().toDateString()
  const yesterdayStr = new Date(Date.now() - 86_400_000).toDateString()
  const groups: { label: string; items: AiSessionSummary[] }[] = []
  const today     = sessions.filter((s) => new Date(s.lastActivityAt).toDateString() === todayStr)
  const yesterday = sessions.filter((s) => new Date(s.lastActivityAt).toDateString() === yesterdayStr)
  const earlier   = sessions.filter((s) => {
    const d = new Date(s.lastActivityAt).toDateString()
    return d !== todayStr && d !== yesterdayStr
  })
  if (today.length)     groups.push({ label: 'Today',     items: today })
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday })
  if (earlier.length)   groups.push({ label: 'Earlier',   items: earlier })
  return groups
}

export default function AIChatView() {
  const { data: session } = useSession()
  const { toggleSidebar } = useChatStore()

  const [sessions,      setSessions]      = useState<AiSessionSummary[]>([])
  const [currentSessId, setCurrentSessId] = useState<string | null>(null)
  const [panelOpen,     setPanelOpen]     = useState(true)
  const [clearConfirm,  setClearConfirm]  = useState(false)

  const [messages,     setMessages]     = useState<AiMessage[]>([])
  const [msgsLoading,  setMsgsLoading]  = useState(false)
  const [isStreaming,  setIsStreaming]   = useState(false)

  const [analyzeOpen,   setAnalyzeOpen]   = useState(false)
  const [userSearchQ,   setUserSearchQ]   = useState('')
  const [userResults,   setUserResults]   = useState<SearchUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!session?.accessToken) return
    const token = session.accessToken
    let cancelled = false

    ;(async () => {
      try {
        const r    = await fetch(`${API}/api/v1/ai/sessions`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await r.json() as { success: boolean; data: { sessions: AiSessionSummary[] } }
        if (cancelled || !json.success) return

        const loaded = json.data.sessions
        setSessions(loaded)

        if (loaded.length > 0) {
          const first = loaded[0]
          setCurrentSessId(first._id)
          setMsgsLoading(true)
          const mr   = await fetch(`${API}/api/v1/ai/messages?sessionId=${first._id}&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
          const mj   = await mr.json() as { success: boolean; data: { messages: { _id: string; role: 'user' | 'assistant'; content: string }[] } }
          if (!cancelled && mj.success) {
            setMessages(mj.data.messages.map((m) => ({ id: m._id, role: m.role, content: m.content })))
          }
          setMsgsLoading(false)
        }
      } catch {
        toast.error('Failed to load AI sessions')
      }
    })()

    return () => { cancelled = true }
  }, [session?.accessToken])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!analyzeOpen || !session?.accessToken) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const r    = await fetch(`${API}/api/v1/users/search?q=${encodeURIComponent(userSearchQ)}`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
        const json = await r.json()
        if (json.success) setUserResults(json.data.items ?? [])
      } catch {
      } finally { setSearchLoading(false) }
    }, 300)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [userSearchQ, analyzeOpen, session?.accessToken])

  const loadSession = useCallback(async (sessionId: string) => {
    if (!session?.accessToken) return
    setCurrentSessId(sessionId)
    setMessages([])
    setMsgsLoading(true)
    try {
      const r    = await fetch(`${API}/api/v1/ai/messages?sessionId=${sessionId}&limit=100`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      const json = await r.json() as { success: boolean; data: { messages: { _id: string; role: 'user' | 'assistant'; content: string }[] } }
      if (json.success) {
        setMessages(json.data.messages.map((m) => ({ id: m._id, role: m.role, content: m.content })))
      }
    } catch {
      toast.error('Failed to load chat history')
    } finally { setMsgsLoading(false) }
  }, [session?.accessToken])

  const createNewSession = useCallback(async (): Promise<string | null> => {
    if (!session?.accessToken) return null

    if (currentSessId && messages.length === 0) {
      setPanelOpen(true)
      return currentSessId
    }

    try {
      const r    = await fetch(`${API}/api/v1/ai/sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
      const json = await r.json() as { success: boolean; data: { session: AiSessionSummary } }
      if (!json.success) throw new Error('Session creation failed')
      const newSess = json.data.session
      setSessions((prev) => [newSess, ...prev])
      setCurrentSessId(newSess._id)
      setMessages([])
      setPanelOpen(true)
      return newSess._id
    } catch {
      toast.error('Failed to create new chat')
      return null
    }
  }, [session?.accessToken, currentSessId, messages.length])

  const handleNewChat = useCallback(async () => {
    await createNewSession()
  }, [createNewSession])

  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session?.accessToken) return
    try {
      await fetch(`${API}/api/v1/ai/sessions/${sessionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } })
    } catch {
      toast.error('Failed to delete session')
      return
    }

    setSessions((prev) => {
      const remaining = prev.filter((s) => s._id !== sessionId)
      if (currentSessId === sessionId) {
        if (remaining.length > 0) {
          void loadSession(remaining[0]._id)
        } else {
          setCurrentSessId(null)
          setMessages([])
        }
      }
      return remaining
    })
  }, [session?.accessToken, currentSessId, loadSession])

  const handleClearAll = useCallback(async () => {
    if (!session?.accessToken) return
    try {
      await fetch(`${API}/api/v1/ai/sessions`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } })
    } catch {
      toast.error('Failed to clear history')
      setClearConfirm(false)
      return
    }
    setSessions([])
    setCurrentSessId(null)
    setMessages([])
    setClearConfirm(false)
  }, [session?.accessToken])

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (currentSessId) return currentSessId
    return createNewSession()
  }, [currentSessId, createNewSession])

  const runStream = useCallback(async (
    userLabel: string,
    makeFetch: (sessionId: string) => Promise<Response>,
  ) => {
    if (isStreaming || !session?.accessToken) return
    setAnalyzeOpen(false)

    const sessionId = await ensureSession()
    if (!sessionId) return

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user',      content: userLabel },
      { id: assistantId,         role: 'assistant', content: '', streaming: true },
    ])
    setIsStreaming(true)

    try {
      const response = await makeFetch(sessionId)
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
        const msg = body?.error?.message ?? 'AI request failed'
        toast.error(msg)
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId
            ? { ...m, content: msg, error: true }
            : m),
        )
        return
      }
      await readStream(response, assistantId, setMessages)
    } catch {
      toast.error('AI request failed')
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId
          ? { ...m, content: 'Something went wrong. Please try again.', error: true }
          : m),
      )
    } finally {
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m))
      setIsStreaming(false)
      setSessions((prev) => prev.map((s) =>
        s._id === sessionId
          ? { ...s, title: s.title || userLabel.slice(0, 75), lastActivityAt: new Date().toISOString(), messageCount: s.messageCount + 2 }
          : s,
      ))
    }
  }, [isStreaming, session?.accessToken, ensureSession])

  const handleSend = useCallback(async (userContent: string) => {
    if (isStreaming || !session?.accessToken) return
    const history = messages.map(({ role, content }) => ({ role, content }))

    await runStream(userContent, (sessionId) =>
      fetch(`${API}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ sessionId, messages: [...history, { role: 'user', content: userContent }] }),
      }),
    )
  }, [isStreaming, session?.accessToken, messages, runStream])

  const handleAnalyze = useCallback(async (userId: string, displayName: string) => {
    if (!session?.accessToken) return
    const isSelf = userId === 'me'
    const label  = isSelf ? '📊 Analyse my own behaviour & emotions' : `📊 Analyse ${displayName}'s messages`

    await runStream(label, (sessionId) =>
      fetch(`${API}/api/v1/ai/analyze-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ sessionId, userId }),
      }),
    )
  }, [session?.accessToken, runStream])

  return (
    <div className="flex h-full overflow-hidden">

      <motion.div
        animate={{ width: panelOpen ? 220 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-shrink-0 overflow-hidden"
      >
        <div className="w-[220px] h-full flex flex-col border-r border-[#BFDBFE] bg-[#EFF6FF]/80">

          <div className="flex items-center justify-between px-3 pt-4 pb-2 flex-shrink-0">
            <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest">Chats</p>
            <button
              onClick={handleNewChat}
              title="New Chat"
              className="p-1.5 rounded-xl hover:bg-[#DBEAFE] text-[#2563EB] transition-colors"
            >
              <SquarePen className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto chat-scrollbar">
            {sessions.length === 0 ? (
              <p className="text-center text-xs text-[#6B7280] px-4 py-10 leading-relaxed">
                No chat history yet.<br />Start a new chat above.
              </p>
            ) : (
              groupSessions(sessions).map((group) => (
                <div key={group.label}>
                  <p className="px-3 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-[#6B7280]">
                    {group.label}
                  </p>
                  {group.items.map((s) => (
                    <SessionItem
                      key={s._id}
                      session={s}
                      isActive={s._id === currentSessId}
                      onSelect={() => { if (s._id !== currentSessId) void loadSession(s._id) }}
                      onDelete={(e) => void handleDeleteSession(s._id, e)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="flex-shrink-0 p-3 border-t border-[#BFDBFE]">
            <AnimatePresence mode="wait">
              {clearConfirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="flex gap-1.5"
                >
                  <button
                    onClick={() => void handleClearAll()}
                    className="flex-1 text-[11px] py-1.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setClearConfirm(false)}
                    className="flex-1 text-[11px] py-1.5 rounded-xl bg-[#DBEAFE] text-[#2563EB] hover:bg-[#BFDBFE] transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="clear"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => sessions.length > 0 && setClearConfirm(true)}
                  disabled={sessions.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All History
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="relative flex flex-col flex-1 overflow-hidden min-w-0">

        <div className="absolute inset-x-0 top-0 z-10 rounded-tr-[25px] overflow-hidden">
          <header className="flex items-center gap-3 px-5 py-3.5 header-glass flex-shrink-0">
            <button
              onClick={() => setPanelOpen((p) => !p)}
              className="p-2 rounded-full hover:bg-[#DBEAFE] transition-colors text-[#2563EB] flex-shrink-0"
              title={panelOpen ? 'Hide history' : 'Show history'}
            >
              {panelOpen
                ? <PanelLeftClose className="w-4 h-4" />
                : <PanelLeftOpen  className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-full hover:bg-[#DBEAFE] transition-colors text-[#2563EB]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">
                {sessions.find((s) => s._id === currentSessId)?.title || 'AI Assistant'}
              </h1>
              <p className="text-xs text-gray-500">Powered by DeepSeek</p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#2563EB] bg-[#DBEAFE] px-2.5 py-1 rounded-full flex-shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-[#93C5FD]'}`} />
              {isStreaming ? 'Thinking…' : 'Ready'}
            </div>

            <button
              onClick={() => void createNewSession()}
              disabled={isStreaming}
              title="New Chat"
              className="p-2 rounded-full hover:bg-[#DBEAFE] transition-colors text-[#2563EB] flex-shrink-0 disabled:opacity-40"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          </header>
        </div>

        <div className="flex flex-col flex-1 overflow-hidden pt-[68px]">
          <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-4 flex flex-col gap-3">

            {msgsLoading && (
              <div className="flex flex-col gap-3 px-2 py-4">
                {[65, 50, 75].map((w, i) => (
                  <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    {i % 2 === 0 && <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />}
                    <div className="h-9 rounded-2xl bg-gray-200 animate-pulse" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            )}

            {!msgsLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">
                    {currentSessId ? 'New conversation' : 'AI Assistant'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed max-w-xs">
                    {currentSessId
                      ? 'Ask me anything to get started.'
                      : 'Select a chat from the left or start a new one.'}
                  </p>
                </div>

                {(currentSessId || sessions.length === 0) && (
                  <>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Explain a concept', 'Write some code', 'Give me ideas'].map((hint) => (
                        <button
                          key={hint}
                          onClick={() => void handleSend(hint)}
                          disabled={isStreaming}
                          className="text-xs text-[#1F2937] bg-white hover:bg-[#DBEAFE] border border-[#BFDBFE] px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>

                    <div className="w-full max-w-xs flex flex-col gap-2 mt-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Insights from your chat history
                      </p>
                      <button
                        onClick={() => void handleAnalyze('me', 'myself')}
                        disabled={isStreaming}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 transition-colors text-left disabled:opacity-50"
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

                      <button
                        onClick={() => { setAnalyzeOpen(true); setUserSearchQ(''); setUserResults([]) }}
                        disabled={isStreaming}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-[#BFDBFE] hover:bg-[#EFF6FF] transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                          <UserSearch className="w-4 h-4 text-[#2563EB]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1F2937]">Analyse someone else</p>
                          <p className="text-[10px] text-[#6B7280] mt-0.5">Pick a user from your conversations</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#93C5FD] flex-shrink-0" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {messages.map((msg) => <AiBubble key={msg.id} message={msg} />)}
            <div ref={bottomRef} />
          </div>
        </div>

        <AnimatePresence>
          {analyzeOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/20 z-20 rounded-tr-[25px]"
                onClick={() => setAnalyzeOpen(false)}
              />
              <motion.div
                key="sheet"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
                className="absolute bottom-0 inset-x-0 z-30 bg-[#EFF6FF] rounded-t-[25px] border-t border-[#BFDBFE] shadow-2xl flex flex-col"
                style={{ maxHeight: '60%' }}
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Analyse a User</p>
                    <p className="text-xs text-gray-500 mt-0.5">Search from your conversations</p>
                  </div>
                  <button onClick={() => setAnalyzeOpen(false)} className="p-2 rounded-full hover:bg-[#DBEAFE] text-[#6B7280]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-5 pb-3 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-white/70 border border-[#BFDBFE] rounded-2xl px-3 py-2">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      autoFocus
                      value={userSearchQ}
                      onChange={(e) => setUserSearchQ(e.target.value)}
                      placeholder="Search by name or username…"
                      className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="h-px bg-[#BFDBFE] mx-5 flex-shrink-0" />
                <div className="overflow-y-auto chat-scrollbar flex-1 py-2">
                  {searchLoading && <p className="text-center text-xs text-gray-400 py-6">Searching…</p>}
                  {!searchLoading && userResults.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-6">
                      {userSearchQ ? 'No users found' : 'Start typing to search'}
                    </p>
                  )}
                  {!searchLoading && userResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => void handleAnalyze(u._id, u.displayName)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#DBEAFE] transition-colors text-left"
                    >
                      <Avatar src={u.avatar} initials={u.displayName.slice(0, 2).toUpperCase()} name={u.displayName} id={u._id} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.displayName}</p>
                        <p className="text-xs text-gray-500">@{u.username}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <MessageInput onSend={(c) => void handleSend(c)} onTypingStart={() => {}} onTypingStop={() => {}} />
      </div>
    </div>
  )
}

function SessionItem({
  session, isActive, onSelect, onDelete,
}: {
  session: AiSessionSummary
  isActive: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
        isActive ? 'bg-[#BFDBFE]' : 'hover:bg-[#DBEAFE]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#1F2937] truncate leading-snug">
          {session.title || 'New Chat'}
        </p>
        <p className="text-[10px] text-[#6B7280] mt-0.5">{formatRelative(session.lastActivityAt)}</p>
      </div>
      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#BFDBFE] text-[#6B7280] transition-all mt-0.5"
        title="Delete chat"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

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
        <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-gray-200 text-gray-900 rounded-2xl rounded-br-sm'
          : message.error
            ? 'bg-red-50 text-red-600 border border-red-200 rounded-2xl rounded-bl-sm'
            : 'bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-sm'
      }`}>
        <span className="whitespace-pre-wrap break-words">{message.content}</span>
        {message.streaming && (
          <span className="inline-block w-[2px] h-[14px] bg-gray-400 ml-0.5 align-middle animate-pulse rounded-full" />
        )}
      </div>
      {isUser && <div className="w-7 flex-shrink-0" />}
    </motion.div>
  )
}
