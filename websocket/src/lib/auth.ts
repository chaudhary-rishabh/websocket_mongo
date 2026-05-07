import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

/* ─── Type augmentation ──────────────────────────────────────────────── */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      displayName: string
      avatar?: string
      bio?: string
      role: string
    } & DefaultSession['user']
    accessToken: string
    refreshToken: string
  }

  interface User {
    username: string
    displayName: string
    avatar?: string
    bio?: string
    role: string
    accessToken: string
    refreshToken: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken: string
    refreshToken: string
    userId: string
    username: string
    displayName: string
    avatar?: string
    bio?: string
    role: string
  }
}

const API_URL = process.env.API_URL ?? 'http://localhost:4000'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          const json = await res.json()
          if (!res.ok || !json.success) return null
          const { user, accessToken, refreshToken } = json.data as {
            user: {
              _id: string; email: string; username: string
              displayName: string; avatar?: string; bio?: string; role: string
            }
            accessToken: string
            refreshToken: string
          }
          return {
            id: user._id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            bio: user.bio,
            role: user.role,
            accessToken,
            refreshToken,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.userId = user.id!
        token.username = user.username
        token.displayName = user.displayName
        token.avatar = user.avatar
        token.bio = user.bio
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.user.id = token.userId
      session.user.username = token.username
      session.user.displayName = token.displayName
      session.user.avatar = token.avatar
      session.user.bio = token.bio
      session.user.role = token.role
      return session
    },
  },

  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
