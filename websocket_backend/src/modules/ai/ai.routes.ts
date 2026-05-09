import { Router, type Request, type Response } from 'express'
import { authenticate } from '../../middleware/auth.js'
import {
  aiReadRateLimit,
  aiSessionMutateRateLimit,
  aiChatRateLimit,
  aiAnalyzeRateLimit,
} from '../../middleware/rateLimit.js'
import { env } from '../../config/env.js'
import { logger } from '../../shared/utils/logger.js'
import type { AuthRequest } from '../../shared/types/index.js'
import { Conversation } from '../conversations/conversation.model.js'
import { Message } from '../messages/message.model.js'
import { User } from '../users/user.model.js'
import { AiSession } from './ai.session.model.js'
import { AiMessage } from './ai.message.model.js'

const router = Router()
router.use(authenticate())

async function createSession(userId: string) {
  return AiSession.create({ userId, messageCount: 0, lastActivityAt: new Date() })
}

async function findSession(sessionId: string, userId: string) {
  return AiSession.findOne({ _id: sessionId, userId })
}

async function persist(
  sessionId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  type: 'chat' | 'analysis',
  metadata?: { model?: string; analyzedUserId?: string; analyzedUserName?: string },
) {
  await AiMessage.create({ sessionId, userId, role, content, type, ...(metadata !== undefined && { metadata }) })

  if (role === 'user') {
    await AiSession.updateOne(
      { _id: sessionId, title: { $exists: false } },
      { $set: { title: content.slice(0, 75).trim() } },
    )
  }

  await AiSession.findByIdAndUpdate(sessionId, {
    $inc: { messageCount: 1 },
    lastActivityAt: new Date(),
  })
}

async function handleUpstreamError(upstream: globalThis.Response, res: Response, tag: string): Promise<void> {
  const body = await upstream.text().catch(() => '<unreadable>')
  logger.error({ status: upstream.status, body }, `DeepSeek error [${tag}]`)
  res.write(`data: ${JSON.stringify({ error: `AI service error (${upstream.status}): ${body.slice(0, 200)}` })}\n\n`)
  res.end()
}

async function pipeStream(
  upstream: Response | globalThis.Response,
  res: Response,
  onDone: (accumulated: string) => Promise<void>,
): Promise<void> {
  const fetchResponse = upstream as globalThis.Response
  if (!fetchResponse.body) throw new Error('No upstream body')

  const reader  = fetchResponse.body.getReader()
  const decoder = new TextDecoder()
  let buffer      = ''
  let accumulated = ''
  let clientGone  = false

  ;(res as unknown as { req: Request }).req.once('close', () => { clientGone = true })

  while (!clientGone) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') { res.write('data: [DONE]\n\n'); continue }
      try {
        const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] }
        const content = json.choices?.[0]?.delta?.content
        if (content) {
          accumulated += content
          res.write(`data: ${JSON.stringify({ content })}\n\n`)
        }
      } catch {}
    }
  }

  if (accumulated.trim()) await onDone(accumulated)
}

const ANALYSIS_SYSTEM_PROMPT = `You are an expert psychologist, emotional intelligence specialist, and behavioural analyst embedded inside a private chat application.

You will be given a chronological sequence of real chat messages involving a specific person. Your job is to produce a warm, empathetic, and insightful analysis of that person based ONLY on what is written in those messages.

Structure your response with the following sections using markdown:

**1. 🧠 Personality & Communication Style**
How do they write? Are they formal or casual, direct or indirect, concise or verbose? What tone do they usually take?

**2. 💬 Social Dynamics**
How do they engage with people? Are they an initiator or a responder? Supportive, assertive, playful, or reserved? How do they handle disagreement?

**3. 💭 Emotional Patterns & Current State**
What emotions come through across their messages? Are there any shifts over time? Based on their most recent messages, what emotional state do they appear to be in right now?

**4. 🔁 Behavioural Tendencies**
What recurring habits or patterns show up? How consistent is their behaviour? Any notable quirks or strengths?

**5. ✨ Key Insight**
The single most important thing this message history reveals about this person — something they may not even realise themselves.

**6. 💚 Closing Note**
End with a brief, encouraging, and human note directed to the person being analysed (or to the user requesting the analysis).

Rules you must follow:
- Be warm, non-judgmental, and constructive — like a thoughtful friend who happens to be a trained psychologist
- Draw conclusions ONLY from the provided messages — do not invent or assume anything not in the data
- If the message history is too sparse (fewer than 10 messages), acknowledge that openly and give a limited reading
- Write in clear, human language — avoid clinical jargon
- Keep the total response focused and readable`

router.get('/sessions', aiReadRateLimit, async (req: Request, res: Response): Promise<void> => {
  const { sub } = (req as AuthRequest).user
  const sessions = await AiSession.find({ userId: sub })
    .sort({ lastActivityAt: -1 })
    .lean()
  res.json({ success: true, data: { sessions } })
})

router.post('/sessions', aiSessionMutateRateLimit, async (req: Request, res: Response): Promise<void> => {
  const { sub } = (req as AuthRequest).user
  try {
    const session = await createSession(sub)
    res.status(201).json({ success: true, data: { session } })
  } catch (err) {
    logger.error({ err }, 'Failed to create AI session')
    res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Could not create session' } })
  }
})

router.delete('/sessions', aiSessionMutateRateLimit, async (req: Request, res: Response): Promise<void> => {
  const { sub } = (req as AuthRequest).user
  const sessions = await AiSession.find({ userId: sub }).select('_id').lean()
  const ids = sessions.map((s) => s._id)
  await AiMessage.deleteMany({ sessionId: { $in: ids } })
  await AiSession.deleteMany({ userId: sub })
  res.json({ success: true, data: {} })
})

router.delete('/sessions/:sessionId', aiSessionMutateRateLimit, async (req: Request, res: Response): Promise<void> => {
  const { sub } = (req as AuthRequest).user
  const { sessionId } = req.params as { sessionId: string }

  const session = await findSession(sessionId, sub)
  if (!session) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } })
    return
  }

  await AiMessage.deleteMany({ sessionId: session._id })
  await AiSession.findByIdAndDelete(sessionId)
  res.json({ success: true, data: {} })
})

router.get('/messages', aiReadRateLimit, async (req: Request, res: Response): Promise<void> => {
  const { sub } = (req as AuthRequest).user
  const limit     = Math.min(Number(req.query['limit'] ?? 100), 200)
  const before    = req.query['before'] as string | undefined
  const sessionId = req.query['sessionId'] as string | undefined

  const sessionDoc = sessionId
    ? await AiSession.findOne({ _id: sessionId, userId: sub }).lean()
    : await AiSession.findOne({ userId: sub }).sort({ lastActivityAt: -1 }).lean()

  if (!sessionDoc) {
    res.json({ success: true, data: { messages: [], hasMore: false } })
    return
  }

  const filter: Record<string, unknown> = { sessionId: sessionDoc._id }
  if (before) filter['_id'] = { $lt: before }

  const messages = await AiMessage.find(filter)
    .sort({ createdAt: 1 })
    .limit(limit + 1)
    .lean()

  const hasMore = messages.length > limit
  if (hasMore) messages.pop()

  res.json({ success: true, data: { messages, hasMore } })
})

router.post('/chat', aiChatRateLimit, async (req: Request, res: Response): Promise<void> => {
  if (!env.DEEPSEEK_API_KEY) {
    res.status(503).json({ success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI service is not configured' } })
    return
  }

  const { sub } = (req as AuthRequest).user
  const { messages, sessionId: providedSessionId } = req.body as {
    messages: { role: string; content: string }[]
    sessionId?: string
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'messages array is required' } })
    return
  }

  const newUserMessage = messages[messages.length - 1]
  if (!newUserMessage || newUserMessage.role !== 'user') {
    res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Last message must be a user message' } })
    return
  }

  let session: Awaited<ReturnType<typeof createSession>>
  if (providedSessionId) {
    const found = await findSession(providedSessionId, sub)
    if (!found) {
      res.status(400).json({ success: false, error: { code: 'INVALID_SESSION', message: 'Session not found' } })
      return
    }
    session = found
  } else {
    session = await createSession(sub)
  }

  await persist(session._id.toString(), sub, 'user', newUserMessage.content, 'chat')

  const currentUser = await User.findById(sub).select('displayName username bio createdAt').lean().catch(() => null)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const userCtx = currentUser
    ? [
        ``,
        `The person you are talking to:`,
        `- Name: ${currentUser.displayName}`,
        `- Username: @${currentUser.username}`,
        ...(currentUser.bio ? [`- Bio: ${currentUser.bio}`] : []),
        `- Member since: ${new Date(currentUser.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
        ``,
        `Address them by their first name when it feels natural. Be warm and personal.`,
      ].join('\n')
    : ''

  const systemPrompt = {
    role: 'system',
    content:
      'You are a helpful, friendly, and concise AI assistant embedded in a private chat application. ' +
      'Use markdown formatting where appropriate (code blocks, bullet points, bold). ' +
      'Keep responses clear and to the point.' +
      userCtx,
  }

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY!}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemPrompt, ...messages],
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      await handleUpstreamError(upstream, res, 'chat')
      return
    }

    await pipeStream(upstream as unknown as Response, res, async (accumulated) => {
      await persist(session._id.toString(), sub, 'assistant', accumulated, 'chat', { model: 'deepseek-chat' })
    })
  } catch (err) {
    logger.error({ err }, 'AI chat stream error')
    if (!res.writableEnded) res.write(`data: ${JSON.stringify({ error: 'Stream failed. Please try again.' })}\n\n`)
  }

  if (!res.writableEnded) res.end()
})

router.post('/analyze-user', aiAnalyzeRateLimit, async (req: Request, res: Response): Promise<void> => {
  if (!env.DEEPSEEK_API_KEY) {
    res.status(503).json({ success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI service is not configured' } })
    return
  }

  const { sub } = (req as AuthRequest).user
  const { userId, userLabel, sessionId: providedSessionId } = req.body as {
    userId?: string
    userLabel?: string
    sessionId?: string
  }

  const isSelf   = !userId || userId === 'me' || userId === sub
  const targetId = isSelf ? sub : userId!

  const targetUser = await User.findById(targetId).lean().catch(() => null)
  if (!targetUser) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })
    return
  }
  const targetName = targetUser.displayName

  const convFilter = isSelf
    ? { members: targetId }
    : { members: { $all: [sub, targetId] } }

  const conversations = await Conversation.find(convFilter)
    .populate('members', 'displayName username')
    .lean()

  if (conversations.length === 0) {
    res.status(400).json({ success: false, error: { code: 'NO_DATA', message: 'No shared conversations found to analyse' } })
    return
  }

  const convIds    = conversations.map((c) => c._id)
  const rawMessages = await Message.find({
    conversationId: { $in: convIds },
    type: 'text',
    deletedFor: { $nin: [targetId] },
  })
    .populate('senderId', 'displayName')
    .sort({ createdAt: 1 })
    .limit(500)
    .lean()

  if (rawMessages.length === 0) {
    res.status(400).json({ success: false, error: { code: 'NO_DATA', message: 'No text messages found to analyse' } })
    return
  }

  const convMap = new Map(conversations.map((c) => [c._id.toString(), c]))
  const grouped = new Map<string, typeof rawMessages>()
  for (const msg of rawMessages) {
    const key = msg.conversationId.toString()
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(msg)
  }

  const sections: string[] = []
  for (const [convId, msgs] of grouped) {
    const conv      = convMap.get(convId)
    const convLabel = conv?.name ? `Group: ${conv.name}` : 'Direct Message'
    const lines     = msgs.map((m) => {
      const sender   = typeof m.senderId === 'object' && 'displayName' in m.senderId
        ? (m.senderId as { displayName: string }).displayName : 'Unknown'
      const isTarget = m.senderId.toString() === targetId
      const tag      = isTarget ? `[${targetName}]` : `[${sender}]`
      const date     = new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      return `${date} ${tag}: ${m.content}`
    })
    sections.push(`=== ${convLabel} ===\n${lines.join('\n')}`)
  }

  const messageBlock = sections.join('\n\n')
  const userPrompt   = isSelf
    ? `Please analyse ME (${targetName}) based on my chat history below.\n\n${messageBlock}`
    : `Please analyse ${targetName} based on their chat history below.\n\n${messageBlock}`

  const requestLabel = userLabel ?? (isSelf ? `Analyse my own behaviour & emotions` : `Analyse ${targetName}'s messages`)

  let session: Awaited<ReturnType<typeof createSession>>
  if (providedSessionId) {
    const found = await findSession(providedSessionId, sub)
    if (!found) {
      res.status(400).json({ success: false, error: { code: 'INVALID_SESSION', message: 'Session not found' } })
      return
    }
    session = found
  } else {
    session = await createSession(sub)
  }

  await persist(session._id.toString(), sub, 'user', requestLabel, 'analysis')

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY!}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
        stream: true,
        max_tokens: 2048,
        temperature: 0.6,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      await handleUpstreamError(upstream, res, 'analyze-user')
      return
    }

    await pipeStream(upstream as unknown as Response, res, async (accumulated) => {
      await persist(session._id.toString(), sub, 'assistant', accumulated, 'analysis', {
        model:            'deepseek-chat',
        analyzedUserId:   targetId,
        analyzedUserName: targetName,
      })
    })
  } catch (err) {
    logger.error({ err }, 'AI analyze-user stream error')
    if (!res.writableEnded) res.write(`data: ${JSON.stringify({ error: 'Analysis failed. Please try again.' })}\n\n`)
  }

  if (!res.writableEnded) res.end()
})

export default router
