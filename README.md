# ChatApp

A full-stack real-time chat application — Next.js 16 frontend, Express 5 + WebSocket backend, MongoDB, and an AI assistant powered by DeepSeek.

![UI Design](UIDesign.png)

---

## Features

- **Real-time messaging** — WebSocket with live delivery, typing indicators, and auto-reconnect
- **Group chats** — create groups, add/remove members, admin roles, leave group
- **Message editing & reactions** — inline edit with `edited` label; emoji reactions synced via WebSocket
- **Read receipts** — per-message `readBy` tracking broadcast to all room members
- **Cursor-based pagination** — infinite scroll with zero-jump scroll restoration
- **AI Assistant** — streaming chat via DeepSeek SSE; multi-session history persisted in MongoDB
- **User analysis** — AI personality & emotion report built from real conversation history
- **Auth** — RS256 JWT with proactive server-side refresh + reactive client-side 401 retry and single-flight deduplication
- **Profile** — editable name, bio, avatar upload (Cloudinary)
- **Rate limiting** — per-user limits on all AI routes (chat: 20/15 min; analysis: 5/hr)
- **Media** — image and voice message rendering

---

## Project Structure

```
Project/
├── websocket/              # Next.js 16 frontend
└── websocket_backend/      # Express 5 + WebSocket backend
```

See each package for its own detailed README:

- [`websocket/README.md`](websocket/README.md) — frontend setup, auth flow, pagination, component map
- [`websocket_backend/README.md`](websocket_backend/README.md) — API reference, WebSocket events, DB schema

---

## Tech Stack

### Frontend (`websocket/`)

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | NextAuth v5 (Credentials + JWT, RS256) |
| State | Zustand 5 |
| Animations | Framer Motion |
| Real-time | WebSocket (native browser API) |
| Notifications | Sonner (toast library) |

### Backend (`websocket_backend/`)

| | |
|---|---|
| Runtime | Node.js >= 22 |
| Framework | Express 5 (TypeScript, ESM) |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT RS256 (jose) — 15 min access + 7 d refresh with rotation |
| Real-time | WebSocket (ws) |
| AI | DeepSeek API (OpenAI-compatible, SSE streaming) |
| Media | Multer + Cloudinary |
| Security | Helmet, CORS, HPP, mongo-sanitize, express-rate-limit |
| Logging | Pino + pino-http |

---

## Quick Start

### 1. Backend

```bash
cd websocket_backend
pnpm install
node scripts/generate-keys.js   # generate RS256 key pair (run once)
cp .env.example .env            # fill in values (see below)
pnpm dev                        # starts on http://localhost:4000
```

**Required environment variables:**

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/chatapp

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

### 2. Frontend

```bash
cd websocket
npm install
cp .env.local.example .env.local   # fill in values (see below)
npm run dev                         # starts on http://localhost:3000
```

**Required environment variables:**

```env
AUTH_SECRET=               # any random string (NextAuth signing secret)
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## Architecture

```
Browser
  │
  ├── HTTPS (REST)  ──►  Next.js API routes (NextAuth)
  │                          │  session cookie (JWT, httpOnly)
  │
  ├── HTTPS (REST)  ──►  Express 5  ──►  MongoDB
  │    Bearer token              │
  │                              └── Cloudinary (media)
  │                              └── DeepSeek API (AI, SSE)
  │
  └── WebSocket     ──►  ws server (same Express process)
       Bearer token       rooms per conversation
                          events: NEW_MESSAGE, TYPING, REACTION_UPDATED, …
```

### Auth flow

```
Login  →  accessToken (15 min RS256) + refreshToken (7 d RS256)
                 ↓  stored in encrypted NextAuth JWT cookie
Session read  →  JWT callback checks expiry (60 s buffer)
                 ↓  near expiry  →  POST /api/v1/auth/refresh
API call  →  401  →  client doRefresh() (single-flight)  →  retry  →  update() syncs cookie
Logout  →  POST /api/v1/auth/logout (revokes DB token) + signOut()
```

---

## Scripts

### Backend

```bash
pnpm dev             # tsx watch — hot reload
pnpm build           # tsc → dist/
pnpm start           # node dist/index.js
pnpm type-check      # tsc --noEmit
pnpm test            # vitest
pnpm test:coverage   # vitest coverage
```

### Frontend

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint
```
