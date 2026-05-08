# ChatApp — Backend

REST + WebSocket API server for ChatApp. Handles authentication, messaging, real-time events, media uploads, and AI-powered features.

## Tech Stack

| | |
|---|---|
| Runtime | Node.js >= 22 |
| Framework | Express 5 (TypeScript, ESM) |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT RS256 (jose) — access (15m) + refresh (7d) |
| Real-time | WebSocket (ws) |
| Media | Multer + Cloudinary |
| AI | DeepSeek API (OpenAI-compatible, SSE streaming) |
| Validation | Zod 4 |
| Logging | Pino + pino-http |
| Security | Helmet, CORS, HPP, express-mongo-sanitize, rate-limit |
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

DEEPSEEK_API_KEY=       # optional — AI features disabled if absent

CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## API Routes

All routes are prefixed with `/api/v1`.

### Auth — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create account |
| POST | `/login` | Login, returns access + refresh tokens |
| POST | `/logout` | Invalidate refresh token |
| POST | `/refresh` | Exchange refresh token for new access token |

### Users — `/users`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Own profile |
| PATCH | `/me` | Update name, bio |
| GET | `/search?q=` | Search users |
| GET | `/:userId` | Get any user's public profile |

### Conversations — `/conversations`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All conversations for the authenticated user |
| POST | `/` | Create 1-to-1 or group conversation |
| GET | `/:id` | Single conversation with populated members |
| PATCH | `/:id` | Update group name/avatar (admin only) |
| DELETE | `/:id/leave` | Leave a group |
| POST | `/:id/members` | Add members (admin only) |
| DELETE | `/:id/members/:memberId` | Remove a member (admin only) |

### Messages — `/messages`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:conversationId` | Paginated message history |
| POST | `/:conversationId` | Send a text message |
| DELETE | `/:messageId` | Delete a message (soft delete) |

### Media — `/media`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload image/file to Cloudinary |
| POST | `/avatar` | Upload and set own avatar |

### AI — `/ai`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/messages` | Paginated AI chat history |
| POST | `/chat` | Stream a chat response (SSE) |
| POST | `/analyze-user` | Stream a personality analysis (SSE) |

## Database Collections

```
users             — accounts, hashed passwords, avatar, online status
conversations     — 1-to-1 and group threads, members[], admins[]
messages          — chat messages, soft-delete per user, reactions
ai_sessions       — one document per user (AI conversation root)
ai_messages       — individual AI turns (role, content, type, metadata)
```

`ai_sessions` and `ai_messages` are isolated from the regular chat collections. The AI endpoints read from `messages` and `conversations` to build context but write only to the AI collections.

## Real-time Events (WebSocket)

Clients connect to `ws://localhost:4000` with a valid JWT. Events:

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:new` | server → client | New message delivered |
| `message:deleted` | server → client | Message soft-deleted |
| `typing:start` | client → server | User started typing |
| `typing:stop` | client → server | User stopped typing |
| `typing` | server → client | Broadcast typing state |
| `user:online` | server → client | User came online |
| `user:offline` | server → client | User went offline |

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
