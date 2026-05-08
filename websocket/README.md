# ChatApp — Frontend

A real-time chat application built with Next.js 16, featuring live messaging, group chats, AI assistant, and personality analytics.

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
      layout.tsx           # Shell: Sidebar + main panel
      page.tsx             # Redirects to first conversation
      [id]/page.tsx        # Conversation view (1-to-1 or group)
      ai/page.tsx          # AI assistant chat
    login/                 # Credentials login
    signup/                # Registration
    profile/               # Own profile (editable)
    user/[id]/             # View another user's profile
    actions/auth.ts        # Logout server action
  components/
    chat/
      Sidebar.tsx          # Left panel, conversation list, AI button
      ChatView.tsx         # Main chat area (header + messages + input)
      ChatHeader.tsx       # Conversation header + group members modal
      MessageList.tsx      # Scrollable message history
      MessageBubble.tsx    # Individual message (text / image / voice)
      MessageInput.tsx     # Composer with typing indicator
      GroupMembersModal.tsx # View, add, remove members; leave group
      SearchModal.tsx      # Global user/conversation search
      AIChatView.tsx       # AI assistant — streaming SSE + persisted history
    profile/
      ProfilePage.tsx      # Own profile (editable name, bio, avatar)
      RealUserProfile.tsx  # Other user's profile (fetched live)
    ui/
      Avatar.tsx           # Initials/image avatar with online ring
      providers.tsx        # SessionProvider wrapper
  lib/
    api.ts                 # Typed fetch wrapper (get / post / patch)
    auth.ts                # NextAuth config + Credentials provider
    store.ts               # Zustand store (active conv, sidebar, search)
    utils.ts               # cn(), formatTime(), getAvatarColor()
    chat-types.ts          # Shared types: ApiConversation, PopulatedMember
  proxy.ts                 # Route protection middleware (Next.js 16)
```

## Features

- **Real-time messaging** — WebSocket with typing indicators and live delivery
- **Group chats** — create groups, add/remove members, admin controls, leave group
- **AI Assistant** — streaming chat via DeepSeek SSE, history persisted across sessions
- **User analysis** — AI personality & emotion report built from real conversation history
- **Auth** — JWT login/signup with access + refresh token rotation
- **Profile** — editable name, bio, avatar upload (Cloudinary)
- **Media** — image and voice message rendering

## Scripts

```bash
npm run dev      # Development server (Turbopack)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

## Notes

- Middleware lives in `src/proxy.ts` — Next.js 16 naming used in this project
- JWT augmentation uses `@auth/core/jwt`, not `next-auth/jwt`
- shadcn Button uses `@base-ui/react` — no `asChild` prop; use plain `<Link>` for link-buttons
