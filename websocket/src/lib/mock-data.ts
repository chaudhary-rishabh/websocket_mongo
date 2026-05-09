import type { User, Message, Conversation } from '@/lib/schemas'

const now = new Date()
const minsAgo = (m: number) =>
  new Date(now.getTime() - m * 60 * 1000).toISOString()
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 3600 * 1000).toISOString()
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 86400 * 1000).toISOString()

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Jordan Blake',
  avatar: 'https://i.pravatar.cc/150?img=1',
  initials: 'JB',
  isOnline: true,
  lastSeen: now.toISOString(),
  role: 'member',
}

export const USERS: User[] = [
  {
    id: 'user-1',
    name: 'Jasmin Taylor',
    avatar: 'https://i.pravatar.cc/150?img=5',
    initials: 'JT',
    isOnline: true,
    lastSeen: minsAgo(2),
    role: 'admin',
  },
  {
    id: 'user-2',
    name: 'Alex Johnson',
    avatar: 'https://i.pravatar.cc/150?img=3',
    initials: 'AJ',
    isOnline: true,
    lastSeen: minsAgo(5),
    role: 'member',
  },
  {
    id: 'user-3',
    name: 'Jessie Kim',
    avatar: 'https://i.pravatar.cc/150?img=7',
    initials: 'JK',
    isOnline: false,
    lastSeen: hoursAgo(1),
    role: 'member',
  },
  {
    id: 'user-4',
    name: 'Sarah Miller',
    avatar: 'https://i.pravatar.cc/150?img=9',
    initials: 'SM',
    isOnline: true,
    lastSeen: minsAgo(10),
    role: 'member',
  },
  {
    id: 'user-5',
    name: 'David Chen',
    avatar: 'https://i.pravatar.cc/150?img=11',
    initials: 'DC',
    isOnline: false,
    lastSeen: hoursAgo(3),
    role: 'admin',
  },
  {
    id: 'user-6',
    name: 'Maria Garcia',
    avatar: 'https://i.pravatar.cc/150?img=13',
    initials: 'MG',
    isOnline: true,
    lastSeen: minsAgo(20),
    role: 'member',
  },
  {
    id: 'user-7',
    name: 'Tom Wilson',
    avatar: 'https://i.pravatar.cc/150?img=15',
    initials: 'TW',
    isOnline: false,
    lastSeen: daysAgo(1),
    role: 'member',
  },
  {
    id: 'user-8',
    name: 'Emma Davis',
    avatar: 'https://i.pravatar.cc/150?img=17',
    initials: 'ED',
    isOnline: true,
    lastSeen: minsAgo(8),
    role: 'member',
  },
]

export const ALL_USERS = [CURRENT_USER, ...USERS]

export function getUserById(id: string): User | undefined {
  if (id === 'me') return CURRENT_USER
  return USERS.find((u) => u.id === id)
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    type: 'group',
    name: 'Design Chat',
    initials: 'DC',
    members: ['me', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'],
    onlineCount: 10,
    lastMessage: 'Check out this voice note!',
    lastMessageTime: minsAgo(4),
    unreadCount: 3,
    isPinned: true,
    lastMessageSentByMe: false,
  },
  {
    id: 'conv-2',
    type: 'direct',
    name: 'Alice Johnson',
    avatar: 'https://i.pravatar.cc/150?img=9',
    initials: 'AJ',
    members: ['me', 'user-4'],
    lastMessage: 'Can we sync tomorrow morning?',
    lastMessageTime: minsAgo(20),
    unreadCount: 1,
    isPinned: false,
    lastMessageSentByMe: false,
  },
  {
    id: 'conv-3',
    type: 'group',
    name: 'Dev Team',
    initials: 'DT',
    members: ['me', 'user-2', 'user-5', 'user-7', 'user-8'],
    onlineCount: 3,
    lastMessage: 'PR is ready for review 🚀',
    lastMessageTime: hoursAgo(1),
    unreadCount: 0,
    isPinned: true,
    lastMessageSentByMe: true,
  },
  {
    id: 'conv-4',
    type: 'direct',
    name: 'Tom Wilson',
    avatar: 'https://i.pravatar.cc/150?img=15',
    initials: 'TW',
    members: ['me', 'user-7'],
    lastMessage: 'Thanks for the help earlier!',
    lastMessageTime: daysAgo(1),
    unreadCount: 0,
    isPinned: false,
    lastMessageSentByMe: false,
  },
]

const designChatMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    type: 'text',
    content:
      "Hi everyone! How are you doing today? I've been working on the new design system and wanted to share some updates!",
    timestamp: minsAgo(32),
    reactions: [
      { emoji: '👍', count: 4 },
      { emoji: '🔥', count: 5 },
      { emoji: '💨', count: 4 },
    ],
    viewCount: 16,
    isRead: true,
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-2',
    type: 'text',
    content: "That sounds amazing! Can you share the Figma link? I'd love to take a look.",
    timestamp: minsAgo(28),
    viewCount: 12,
    isRead: true,
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'user-2',
    type: 'text',
    content: "Also, I wanted to discuss the color palette for the dark mode variant.",
    timestamp: minsAgo(26),
    viewCount: 11,
    isRead: true,
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    senderId: 'me',
    type: 'text',
    content: "I've been working on the animations. Check out the prototype I shared yesterday!",
    timestamp: minsAgo(22),
    viewCount: 9,
    isRead: true,
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    senderId: 'user-4',
    type: 'image',
    content: 'https://picsum.photos/seed/designchat/500/320',
    timestamp: minsAgo(18),
    viewCount: 20,
    isRead: true,
  },
  {
    id: 'msg-6',
    conversationId: 'conv-1',
    senderId: 'user-3',
    type: 'voice',
    content: '0:15',
    timestamp: minsAgo(4),
    viewCount: 14,
    isRead: false,
  },
  {
    id: 'msg-7',
    conversationId: 'conv-1',
    senderId: 'me',
    type: 'text',
    content: "Love the direction! Let's finalize the typography next.",
    timestamp: minsAgo(2),
    reactions: [{ emoji: '❤️', count: 3 }],
    viewCount: 5,
    isRead: true,
  },
]

const aliceMessages: Message[] = [
  {
    id: 'msg-a1',
    conversationId: 'conv-2',
    senderId: 'user-4',
    type: 'text',
    content: 'Hey! Did you finish the onboarding flow?',
    timestamp: hoursAgo(2),
    viewCount: 2,
    isRead: true,
  },
  {
    id: 'msg-a2',
    conversationId: 'conv-2',
    senderId: 'me',
    type: 'text',
    content: 'Almost done! Just polishing the last screen.',
    timestamp: hoursAgo(1),
    viewCount: 2,
    isRead: true,
  },
  {
    id: 'msg-a3',
    conversationId: 'conv-2',
    senderId: 'user-4',
    type: 'image',
    content: 'https://picsum.photos/seed/alicechat/500/300',
    timestamp: minsAgo(40),
    viewCount: 3,
    isRead: true,
  },
  {
    id: 'msg-a4',
    conversationId: 'conv-2',
    senderId: 'user-4',
    type: 'text',
    content: "Here's a reference I found. Can we sync tomorrow morning?",
    timestamp: minsAgo(20),
    viewCount: 1,
    isRead: false,
  },
  {
    id: 'msg-a5',
    conversationId: 'conv-2',
    senderId: 'me',
    type: 'text',
    content: 'Sure! 10am works for me.',
    timestamp: minsAgo(18),
    viewCount: 1,
    isRead: true,
  },
]

const devTeamMessages: Message[] = [
  {
    id: 'msg-d1',
    conversationId: 'conv-3',
    senderId: 'user-5',
    type: 'text',
    content: 'Heads up: deploy pipeline is failing on staging.',
    timestamp: hoursAgo(3),
    viewCount: 6,
    isRead: true,
  },
  {
    id: 'msg-d2',
    conversationId: 'conv-3',
    senderId: 'user-2',
    type: 'text',
    content: 'On it. Looks like an env var issue.',
    timestamp: hoursAgo(2),
    viewCount: 5,
    isRead: true,
  },
  {
    id: 'msg-d3',
    conversationId: 'conv-3',
    senderId: 'user-8',
    type: 'voice',
    content: '0:28',
    timestamp: hoursAgo(1),
    viewCount: 4,
    isRead: true,
  },
  {
    id: 'msg-d4',
    conversationId: 'conv-3',
    senderId: 'me',
    type: 'text',
    content: 'Fixed! Also squashed a race condition in the WebSocket handler.',
    timestamp: minsAgo(90),
    viewCount: 4,
    isRead: true,
  },
  {
    id: 'msg-d5',
    conversationId: 'conv-3',
    senderId: 'me',
    type: 'text',
    content: 'PR is ready for review 🚀',
    timestamp: hoursAgo(1),
    viewCount: 3,
    isRead: true,
  },
]

const tomMessages: Message[] = [
  {
    id: 'msg-t1',
    conversationId: 'conv-4',
    senderId: 'me',
    type: 'text',
    content: 'Hey Tom, do you have the API docs for the auth service?',
    timestamp: daysAgo(2),
    viewCount: 2,
    isRead: true,
  },
  {
    id: 'msg-t2',
    conversationId: 'conv-4',
    senderId: 'user-7',
    type: 'text',
    content: 'Sure! Let me find the link.',
    timestamp: daysAgo(2),
    viewCount: 2,
    isRead: true,
  },
  {
    id: 'msg-t3',
    conversationId: 'conv-4',
    senderId: 'user-7',
    type: 'image',
    content: 'https://picsum.photos/seed/tomchat/500/280',
    timestamp: daysAgo(1),
    viewCount: 2,
    isRead: true,
  },
  {
    id: 'msg-t4',
    conversationId: 'conv-4',
    senderId: 'user-7',
    type: 'text',
    content: 'Thanks for the help earlier!',
    timestamp: daysAgo(1),
    viewCount: 1,
    isRead: true,
  },
  {
    id: 'msg-t5',
    conversationId: 'conv-4',
    senderId: 'me',
    type: 'text',
    content: 'Anytime! 👍',
    timestamp: daysAgo(1),
    viewCount: 1,
    isRead: true,
  },
]

export const MESSAGES: Record<string, Message[]> = {
  'conv-1': designChatMessages,
  'conv-2': aliceMessages,
  'conv-3': devTeamMessages,
  'conv-4': tomMessages,
}

export function getMessages(conversationId: string): Message[] {
  return MESSAGES[conversationId] ?? []
}

export function getConversationById(id: string): Conversation | undefined {
  return CONVERSATIONS.find((c) => c.id === id)
}
