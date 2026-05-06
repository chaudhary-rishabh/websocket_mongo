@AGENTS.md
# ChatApp — Next.js Frontend

## Project Overview
A modern real-time chat application UI built with Next.js 15 (App Router), Tailwind CSS v4, and Zod. This is UI-only for now — the Express/Node.js backend will be integrated later.

## Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Validation/Types**: Zod (for form schemas and mock data shapes)
- **Icons**: Lucide React
- **Fonts**: Geist (display) + Inter (body) via next/font
- **Date/Time**: date-fns
- **State**: Zustand (global) + React useState/useReducer (local)
- **Animations**: Framer Motion (subtle, purposeful)

## Project Structure
src/
app/
layout.tsx           # Root layout, fonts, theme
page.tsx             # Redirects to /chat
chat/
layout.tsx         # Chat shell layout (sidebar + main)
page.tsx           # Default: empty state or last chat
[id]/
page.tsx         # 1v1 or group chat view
profile/
page.tsx           # User profile page
components/
chat/
Sidebar.tsx        # Left sidebar
ConversationList.tsx
ConversationItem.tsx
ChatHeader.tsx
MessageList.tsx
MessageBubble.tsx
MessageInput.tsx
SearchModal.tsx
profile/
ProfilePage.tsx
AvatarUpload.tsx
ui/                  # Reusable primitives
Avatar.tsx
Badge.tsx
Input.tsx
Button.tsx
lib/
mock-data.ts         # All mock users, groups, messages
schemas.ts           # Zod schemas
store.ts             # Zustand store
utils.ts             # cn(), formatTime(), etc.
types/
index.ts             # All TypeScript types derived from Zod

## Design Reference
Design follows a clean, modern messaging app aesthetic:
- **Left sidebar**: ~300px, white background, conversation list with avatars, last message preview, timestamps, unread count badges, pin indicators
- **Right panel**: Full chat area, message header with member count, grouped chat bubbles (received = white card left-aligned, sent = purple/indigo right-aligned), media messages, voice message player, emoji reactions
- **Search**: Modal overlay with user and group search
- **Profile**: Dedicated page with avatar, editable fields, settings

## Color Palette
- Background: `#F0F2FF` (very light lavender)
- Sidebar bg: `#FFFFFF`
- Primary accent: `#6C63FF` (indigo/purple)
- Sent bubble: `#6C63FF` (purple, white text)
- Received bubble: `#FFFFFF` (white, dark text)
- Unread badge: `#FF4D4F` (red)
- Online indicator: `#22C55E` (green)
- Text primary: `#1A1A2E`
- Text secondary: `#6B7280`
- Timestamp/meta: `#9CA3AF`

## Mock Data Requirements
All data is static mock data — no API calls. Shapes must match future backend contracts via Zod:
- 8–10 users with names, avatars (use DiceBear or placeholder URLs), online status
- 3–4 groups with member counts
- Each conversation has 10–15 mock messages with timestamps, reactions, media
- Message types: text, image, voice (UI only, no real audio)

## Coding Conventions
- All components are typed with TypeScript
- Use `cn()` from clsx/tailwind-merge for conditional classes
- No `any` types
- All form inputs validated with Zod schemas
- File names: PascalCase for components, camelCase for lib files
- Keep components under 150 lines; split if larger

## What NOT to build yet
- No API calls / fetch
- No authentication flow
- No real WebSocket connections
- No backend integration

## Notes for Claude Code
- Read this CLAUDE.md before every task
- When in doubt about design, refer to the Design Reference section
- Mock data lives in `lib/mock-data.ts` — always import from there, never hardcode in components
- The Zustand store tracks: activeConversationId, searchQuery, sidebarOpen (mobile)