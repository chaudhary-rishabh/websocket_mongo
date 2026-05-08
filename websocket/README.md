# ChatApp — Frontend

A real-time chat application built with Next.js 16, featuring live messaging, group chats, AI assistant, automatic token refresh, and cursor-based message pagination.

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | NextAuth v5 beta (Credentials, JWT) |
| State | Zustand 5 |
| Animations | Framer Motion |
| Validation | Zod 4 |
| Real-time | WebSocket (native) |

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in values
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

```env
AUTH_SECRET=               # NextAuth secret (any random string)
API_URL=                   # Backend URL for server-side calls (e.g. http://localhost:4000)
NEXT_PUBLIC_API_URL=       # Backend URL for client-side calls
NEXT_PUBLIC_WS_URL=        # WebSocket URL (e.g. ws://localhost:4000)
```

## Project Structure

```
src/
  app/
    chat/
      layout.tsx           # Shell: Sidebar + WSProvider + main panel
      page.tsx             # Redirects to first conversation
      [id]/page.tsx        # Conversation view (1-to-1 or group)
      ai/page.tsx          # AI assistant chat
    login/                 # Credentials login
    signup/                # Registration
    profile/               # Own profile (editable)
    user/[id]/             # View another user's profile
    api/auth/[...nextauth] # NextAuth route handler
    actions/auth.ts        # Logout server action (calls backend /logout then signOut)
  components/
    chat/
      WSProvider.tsx        # Mounts auth token store; manages WS connection lifecycle
      Sidebar.tsx           # Left panel — conversation list + AI shortcut + nav
      ChatView.tsx          # Main chat area — header + paginated messages + input
      ChatHeader.tsx        # Conversation header + group members modal
      MessageList.tsx       # Scrollable message history with scroll-to-load pagination
      MessageBubble.tsx     # Individual message (text / image / voice / reactions)
      MessageInput.tsx      # Composer with emoji picker and typing indicators
      GroupMembersModal.tsx # View, add, remove members; leave group
      SearchModal.tsx       # Global user/conversation search
      AIChatView.tsx        # AI assistant — streaming SSE + persisted history
    profile/
      ProfilePage.tsx       # Own profile (editable name, bio, avatar)
      RealUserProfile.tsx   # Other user's profile (fetched live)
    ui/
      Avatar.tsx            # Initials/image avatar with online ring
      providers.tsx         # SessionProvider wrapper
  lib/
    api.ts                  # Typed fetch wrapper + token store + 401-retry logic
    auth.ts                 # NextAuth config — Credentials provider + JWT auto-refresh
    store.ts                # Zustand store (messages, conversations, pagination, presence)
    ws-client.ts            # WebSocket singleton with auto-reconnect + ping/pong
    chat-types.ts           # Shared types: ApiMessage, ApiConversation, WS events
    utils.ts                # cn(), formatTime(), getAvatarColor()
  proxy.ts                  # Route-protection middleware (Next.js 16 naming)
```

## Auth Flow

Authentication uses NextAuth v5 with a Credentials provider backed by the Express backend. Both access and refresh tokens are stored inside the encrypted NextAuth JWT cookie.

### Proactive refresh (server-side)
Every time the NextAuth JWT callback fires — on session reads from middleware, server components, or `useSession()` — it checks whether the access token expires within the next 60 seconds. If so, it calls `POST /api/v1/auth/refresh` transparently and stores the new token pair into the cookie. The session is always fresh by the time a component reads `session.accessToken`.

### Reactive 401 retry (client-side)
`WSProvider` registers a token store in `api.ts` by calling `setAuth()` with the current `accessToken`, `refreshToken`, and an `onRefreshed` callback. If any authenticated request returns a 401:

1. `api.ts` calls `doRefresh()` — single-flight: concurrent 401s all wait for the same refresh, preventing token rotation races.
2. On success, the new tokens are stored in the module-level store and `onRefreshed` is called, which calls NextAuth's `update()` to persist the new tokens into the cookie.
3. The original request is retried once with the new access token.

If the refresh token itself is expired or revoked, NextAuth sets `session.error = 'RefreshAccessTokenError'` and `WSProvider` calls `signOut()` to redirect the user to `/login`.

### Token lifecycle
```
Login → accessToken (15 min RS256) + refreshToken (7 d RS256)
         ↓ stored in NextAuth JWT cookie (httpOnly, encrypted)
Every session read → JWT callback checks expiry with 60 s buffer
         ↓ expired → POST /api/v1/auth/refresh (rotates both tokens)
API call → 401 → client-side doRefresh() → retry → update() syncs cookie
Logout → POST /api/v1/auth/logout (revokes refreshToken in DB) + signOut()
```

## Message Pagination

Messages are loaded with cursor-based pagination — the backend returns 30 messages per page, oldest-to-newest, alongside `hasMore` and `nextCursor`.

### How it works
1. **Initial load** — `ChatView` fetches `?limit=30` (no cursor) when a conversation opens. The response's `{ hasMore, nextCursor }` is stored in Zustand under `messagePagination[conversationId]`.
2. **Scroll-to-top trigger** — `MessageList` places a zero-height sentinel `<div>` at the very top of its scroll container and observes it with an `IntersectionObserver` (rooted on the scroll container itself). When the sentinel enters the viewport, `loadMore()` is called in `ChatView`.
3. **No-jump scroll restoration** — immediately before calling `loadMore()`, the observer snapshots `container.scrollHeight`. After React re-renders with the prepended messages, a `useLayoutEffect` detects that the first message ID changed (prepend, not append) and synchronously sets `scrollTop = newScrollHeight − prevScrollHeight`, keeping the viewport anchored to the same message.
4. **Auto-scroll-to-bottom guard** — the existing scroll-to-bottom effect is gated by an `isNearBottom` ref (within 120 px of the bottom). Loading older messages at the top never hijacks the scroll position.
5. **Single-flight guard** — `isLoadingMore` state prevents overlapping requests while a page is in flight.

```
Scroll to top
  → IntersectionObserver fires
  → snapshot scrollHeight
  → ChatView.loadMore() → GET /conversations/:id/messages?cursor=<nextCursor>&limit=30
  → prependMessages() updates store
  → useLayoutEffect restores scrollTop (no visible jump)
  → "Beginning of conversation" shown when hasMore = false
```

## Key `lib/api.ts` Exports

```ts
setAuth(store)        // Register accessToken, refreshToken, and onRefreshed callback
clearAuth()           // Remove the token store (called on WS disconnect / unmount)
authFetch(url, opts, token?)  // Raw fetch wrapper with 401-retry; returns Response
api.get / .post / .patch / .delete  // Typed helpers; throw on non-2xx
```

## Features

- **Real-time messaging** — WebSocket with typing indicators, live delivery, and auto-reconnect
- **Group chats** — create groups, add/remove members, admin controls, leave group
- **Message pagination** — cursor-based infinite scroll, jump-free scroll restoration
- **Token refresh** — proactive JWT renewal + reactive 401 retry with single-flight deduplication
- **AI Assistant** — streaming chat via DeepSeek SSE, history persisted across sessions
- **User analysis** — AI personality & emotion report built from real conversation history
- **Auth** — RS256 JWT login/signup with access + refresh token rotation
- **Profile** — editable name, bio, avatar upload (Cloudinary)
- **Media** — image and voice message rendering
- **Read receipts** — per-message `readBy` tracking via WebSocket

## Scripts

```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

## Notes

- Middleware lives in `src/proxy.ts` — Next.js 16 uses this name instead of `middleware.ts`
- JWT type augmentation uses `@auth/core/jwt`, not `next-auth/jwt`
- `setAuth()` / `clearAuth()` use module-level state in `api.ts`; safe for client-only usage (no SSR side-effects)
- shadcn Button uses `@base-ui/react` — no `asChild` prop; use plain `<Link>` for link-buttons
- The `IntersectionObserver` in `MessageList` uses `{ root: containerRef.current }` so intersection is measured relative to the scroll container, not the viewport
