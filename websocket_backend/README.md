# ChatApp — Backend

REST + WebSocket API server for ChatApp. Handles authentication with automatic token rotation, cursor-based message pagination, real-time events, media uploads, and AI-powered features.

## Tech Stack

| | |
|---|---|
| Runtime | Node.js >= 22 |
| Framework | Express 5 (TypeScript, ESM) |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT RS256 (jose) — access (15 m) + refresh (7 d) with rotation |
| Real-time | WebSocket (ws) |
| Media | Multer + Cloudinary |
| AI | DeepSeek API (OpenAI-compatible, SSE streaming) |
| Validation | Zod 4 |
| Logging | Pino + pino-http |
| Security | Helmet, CORS, HPP, mongo-sanitize, express-rate-limit |
| Package manager | pnpm |

## Getting Started

```bash
pnpm install
node scripts/generate-keys.js   # generate RS256 key pair
cp .env.example .env            # fill in values
pnpm dev
```

Server runs at `http://localhost:4000`.

## Environment Variables

```env
NODE_ENV=development
PORT=4000

MONGODB_URI=mongodb://localhost:27017/chatapp

# RS256 key pair (generate with: node scripts/generate-keys.js)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

DEEPSEEK_API_KEY=       # optional — AI features return 503 if absent

CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## API Reference

All routes are prefixed with `/api/v1`. Every response follows a consistent envelope:

```jsonc
// success
{ "success": true, "data": { ... } }

// error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

---

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account; returns `accessToken` + `refreshToken` |
| POST | `/login` | — | Verify credentials; returns `accessToken` + `refreshToken` |
| POST | `/refresh` | — | Exchange a valid refresh token for a new token pair (rotates the refresh token) |
| POST | `/logout` | Bearer | Invalidate the current refresh token |

**Token rotation** — every `/refresh` call issues a brand-new `refreshToken` and hashes it into the database. The old refresh token is immediately invalidated. The `accessToken` is a short-lived RS256 JWT (default 15 m); the `refreshToken` is a long-lived RS256 JWT (default 7 d).

---

### Users — `/users`

All routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Own profile |
| PATCH | `/me` | Update `displayName`, `bio` |
| GET | `/search?q=<term>` | Search users by username or display name |
| GET | `/:userId` | Any user's public profile |

---

### Conversations — `/conversations`

All routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All conversations for the authenticated user (with last message + unread count) |
| POST | `/` | Create a DM or group conversation |
| GET | `/:conversationId` | Single conversation with fully populated members |
| PATCH | `/:conversationId` | Update group `name` / `avatar` (admin only) |
| POST | `/:conversationId/members` | Add members to a group (admin only) |
| DELETE | `/:conversationId/members/:memberId` | Remove a member (admin only) |
| DELETE | `/:conversationId/leave` | Leave a group conversation |

---

### Messages — `/conversations/:conversationId/messages`

All routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Cursor-paginated message history (see below) |
| POST | `/` | Send a message |
| POST | `/read` | Mark all messages in this conversation as read |
| PATCH | `/:messageId` | Edit a text message (sender only) |
| DELETE | `/:messageId` | Delete a message (soft-delete per user; hard-delete if own) |
| POST | `/:messageId/reactions` | Toggle an emoji reaction |

#### Cursor-based pagination

```
GET /api/v1/conversations/:id/messages?limit=30&cursor=<messageId>
```

| Query param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | integer 1–100 | 30 | Number of messages per page |
| `cursor` | string (ObjectId) | — | Fetch messages **older than** this ID |

Response:

```jsonc
{
  "success": true,
  "data": {
    "items": [ /* oldest → newest within the page */ ],
    "hasMore": true,          // false when beginning of conversation is reached
    "nextCursor": "64abc..."  // pass as ?cursor= to load the next (older) page; absent when hasMore=false
  }
}
```

Messages are sorted by `_id` descending (newest first) at the DB level, then reversed before returning so `items` is always chronological (oldest → newest). To load older messages, pass the `nextCursor` from the previous response.

---

### Media — `/media`

All routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload image or file to Cloudinary; returns `url` |
| POST | `/avatar` | Upload image and set it as the authenticated user's avatar |

---

### AI — `/ai`

All routes require `Authorization: Bearer <accessToken>`. DeepSeek integration — disabled (503) if `DEEPSEEK_API_KEY` is not set.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions` | List all AI sessions for the user, newest first |
| POST | `/sessions` | Create a new AI session |
| DELETE | `/sessions` | Delete all sessions + messages for the user |
| DELETE | `/sessions/:sessionId` | Delete one session and all its messages |
| GET | `/messages?sessionId=&limit=&before=` | Paginated AI message history for a session |
| POST | `/chat` | Stream an assistant reply via SSE |
| POST | `/analyze-user` | Stream a personality & emotion analysis via SSE |

`/chat` and `/analyze-user` both respond with `Content-Type: text/event-stream`. Each SSE frame carries `{ content: "..." }` chunks; the stream ends with `data: [DONE]`.

---

## Database Collections

```
users           accounts, hashed passwords, bcrypt-hashed refreshTokenHash, avatar, online status
conversations   DM and group threads — members[], admins[], lastMessage snapshot, unreadCount
messages        chat messages — reactions[], readBy[], deletedFor[] (soft delete per user)
ai_sessions     one root document per user per chat session
ai_messages     individual AI turns (role, content, type, metadata)
```

`ai_sessions` / `ai_messages` are isolated from the regular chat collections. The AI `/analyze-user` endpoint reads from `messages` and `conversations` to build context, but writes only to the AI collections.

Indexes:
- `users`: `email`, `username`
- `messages`: `{ conversationId: 1, createdAt: -1 }` — supports the cursor pagination query

---

## Real-time (WebSocket)

Connect to `ws://localhost:4000/ws?token=<accessToken>`. On successful auth the server immediately sends a `CONNECTED` event and auto-joins the user to all their conversation rooms.

### Client → Server

| Event type | Required fields | Description |
|------------|-----------------|-------------|
| `PING` | — | Keepalive; server replies with `PONG` |
| `JOIN_CONVERSATION` | `conversationId` | Subscribe to a room |
| `LEAVE_CONVERSATION` | `conversationId` | Unsubscribe from a room |
| `SEND_MESSAGE` | `conversationId`, `tempId`, `messageType`, `content` | Send a message; `tempId` is echoed back in `NEW_MESSAGE` for optimistic-UI reconciliation |
| `TYPING_START` | `conversationId` | Broadcast that the user is typing |
| `TYPING_STOP` | `conversationId` | Broadcast that the user stopped typing |
| `MARK_READ` | `conversationId` | Mark all unread messages as read; broadcasts `MESSAGES_READ` |
| `ADD_REACTION` | `conversationId`, `messageId`, `emoji` | Toggle an emoji reaction; broadcasts `REACTION_UPDATED` |

### Server → Client

| Event type | Key fields | Description |
|------------|------------|-------------|
| `CONNECTED` | `userId` | Auth confirmed; emitted once after connect |
| `PONG` | — | Reply to `PING` |
| `NEW_MESSAGE` | `message`, `tempId?` | New message in a room |
| `TYPING` | `conversationId`, `userId`, `username` | A user started typing |
| `STOP_TYPING` | `conversationId`, `userId` | A user stopped typing |
| `MESSAGES_READ` | `conversationId`, `userId`, `readAt` | Messages marked as read |
| `USER_ONLINE` | `userId` | A user connected |
| `USER_OFFLINE` | `userId`, `lastSeen` | A user disconnected |
| `REACTION_UPDATED` | `message` | Reaction added or removed — full updated message object |
| `ERROR` | `code`, `message` | Server-side error in handling a client event |

---

## Scripts

```bash
pnpm dev             # tsx watch (hot reload)
pnpm build           # tsc compile to dist/
pnpm start           # run compiled dist/index.js
pnpm test            # vitest run
pnpm test:watch      # vitest watch
pnpm test:coverage   # vitest coverage
pnpm type-check      # tsc --noEmit
```
