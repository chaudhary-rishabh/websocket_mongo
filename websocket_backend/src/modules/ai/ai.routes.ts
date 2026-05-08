import { Router, type Request, type Response } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { env } from '../../config/env.js'
import { logger } from '../../shared/utils/logger.js'
import type { AuthRequest } from '../../shared/types/index.js'
import { Conversation } from '../conversations/conversation.model.js'
import { Message } from '../messages/message.model.js'
import { User } from '../users/user.model.js'

const router = Router()

router.use(authenticate())

/**
 * POST /api/v1/ai/chat
 * Body: { messages: { role: 'user' | 'assistant'; content: string }[] }
 * Response: SSE stream  — data: { content: string }  |  data: [DONE]
 */
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  if (!env.DEEPSEEK_API_KEY) {
    res.status(503).json({
      success: false,
      error: { code: 'AI_UNAVAILABLE', message: 'AI service is not configured' },
    })
    return
  }

  const { messages } = req.body as { messages: { role: string; content: string }[] }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'messages array is required' },
    })
    return
  }

  // ── SSE headers ──────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // disable nginx proxy buffering
  res.flushHeaders()

  // Track client disconnect so we can abort the upstream read
  let clientGone = false
  req.on('close', () => { clientGone = true })

  const systemPrompt = {
    role: 'system',
    content:
      'You are a helpful, friendly, and concise AI assistant embedded in a chat application. ' +
      'Use markdown formatting where appropriate (code blocks, bullet points, bold). ' +
      'Keep responses clear and to the point.',
  }

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemPrompt, ...messages],
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => 'unknown')
      logger.warn({ status: upstream.status, errText }, 'DeepSeek upstream error')
      res.write(`data: ${JSON.stringify({ error: 'AI service returned an error' })}\n\n`)
      res.end()
      return
    }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (!clientGone) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process all complete SSE lines in the buffer
      const lines = buffer.split('\n')
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const payload = trimmed.slice(5).trim()

        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n')
          continue
        }

        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[]
          }
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`)
          }
        } catch {
          // skip malformed chunks — normal at stream boundaries
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'AI stream error')
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed. Please try again.' })}\n\n`)
    }
  }

  if (!res.writableEnded) res.end()
})

// ─── Static analysis system prompt ────────────────────────────────────────────
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

/**
 * POST /api/v1/ai/analyze-user
 * Body: { userId?: string }  — omit / "me" for self-analysis, or pass a real MongoDB userId
 * Response: SSE stream — data: { content: string }  |  data: [DONE]
 *
 * Fetches the full chronological message history of the target user in all
 * conversations shared with the requester, then streams an LLM personality /
 * emotional analysis back via SSE.
 */
router.post('/analyze-user', async (req: Request, res: Response): Promise<void> => {
  if (!env.DEEPSEEK_API_KEY) {
    res.status(503).json({ success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI service is not configured' } })
    return
  }

  const { sub } = (req as AuthRequest).user
  const { userId } = req.body as { userId?: string }

  const isSelf = !userId || userId === 'me' || userId === sub
  const targetId = isSelf ? sub : userId

  // ── Resolve target user's display name ──────────────────────────────────
  const targetUser = await User.findById(targetId).lean().catch(() => null)
  if (!targetUser) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } })
    return
  }
  const targetName = targetUser.displayName

  // ── Find all conversations that include the target ──────────────────────
  // For self: all own conversations. For other: only shared conversations.
  const convFilter = isSelf
    ? { members: targetId }
    : { members: { $all: [sub, targetId] } }

  const conversations = await Conversation.find(convFilter)
    .populate('members', 'displayName username')
    .lean()

  if (conversations.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_DATA', message: 'No shared conversations found to analyse' },
    })
    return
  }

  // ── Fetch messages from those conversations (all senders for context) ───
  const convIds = conversations.map((c) => c._id)

  const rawMessages = await Message.find({
    conversationId: { $in: convIds },
    type: 'text',                   // only text messages are meaningful for analysis
    deletedFor: { $nin: [targetId] },
  })
    .populate('senderId', 'displayName')
    .sort({ createdAt: 1 })
    .limit(500)                     // reasonable LLM context cap
    .lean()

  if (rawMessages.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_DATA', message: 'No text messages found to analyse' },
    })
    return
  }

  // ── Format messages grouped by conversation ─────────────────────────────
  const convMap = new Map(conversations.map((c) => [c._id.toString(), c]))

  const grouped = new Map<string, typeof rawMessages>()
  for (const msg of rawMessages) {
    const key = msg.conversationId.toString()
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(msg)
  }

  const sections: string[] = []
  for (const [convId, msgs] of grouped) {
    const conv = convMap.get(convId)
    const convLabel = conv?.name
      ? `Group: ${conv.name}`
      : 'Direct Message'

    const lines = msgs.map((m) => {
      const sender =
        typeof m.senderId === 'object' && 'displayName' in m.senderId
          ? (m.senderId as { displayName: string }).displayName
          : 'Unknown'
      const isTarget = m.senderId.toString() === targetId
      const tag = isTarget ? `[${targetName}]` : `[${sender}]`
      const date = new Date(m.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      return `${date} ${tag}: ${m.content}`
    })

    sections.push(`=== ${convLabel} ===\n${lines.join('\n')}`)
  }

  const messageBlock = sections.join('\n\n')
  const userPrompt = isSelf
    ? `Please analyse ME (${targetName}) based on my chat history below.\n\n${messageBlock}`
    : `Please analyse ${targetName} based on their chat history below.\n\n${messageBlock}`

  // ── SSE setup ───────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  let clientGone = false
  req.on('close', () => { clientGone = true })

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
        stream: true,
        max_tokens: 2048,
        temperature: 0.6,   // slightly lower for more consistent analysis
      }),
    })

    if (!upstream.ok || !upstream.body) {
      res.write(`data: ${JSON.stringify({ error: 'AI service returned an error' })}\n\n`)
      res.end()
      return
    }

    const reader  = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

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
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`)
        } catch {/* skip malformed */}
      }
    }
  } catch (err) {
    logger.error({ err }, 'AI analyze-user stream error')
    if (!res.writableEnded) res.write(`data: ${JSON.stringify({ error: 'Analysis failed. Please try again.' })}\n\n`)
  }

  if (!res.writableEnded) res.end()
})

export default router
