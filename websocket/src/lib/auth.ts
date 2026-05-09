import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { JWT } from '@auth/core/jwt'

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
    accessTokenExpiry: number
    error?: 'RefreshAccessTokenError'
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
    accessTokenExpiry: number
    userId: string
    username: string
    displayName: string
    avatar?: string
    bio?: string
    role: string
    error?: 'RefreshAccessTokenError'
  }
}

const API_URL = process.env.API_URL ?? 'http://localhost:4000'

function decodeJwtExpiry(token: string): number {
  try {
    const part = token.split('.')[1]
    const payload = JSON.parse(
      Buffer.from(part, 'base64url').toString('utf8'),
    ) as { exp?: number }
    return (payload.exp ?? 0) * 1000
  } catch {
    return Date.now() + 14 * 60 * 1000
  }
}

async function refreshAccessToken(oldToken: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: oldToken.refreshToken }),
    })
    const json = (await res.json()) as {
      success: boolean
      data?: { accessToken: string; refreshToken: string }
    }
    if (!res.ok || !json.success || !json.data) throw new Error('Refresh failed')
    return {
      ...oldToken,
      accessToken: json.data.accessToken,
      refreshToken: json.data.refreshToken,
      accessTokenExpiry: decodeJwtExpiry(json.data.accessToken),
      error: undefined,
    }
  } catch {
    return { ...oldToken, error: 'RefreshAccessTokenError' }
  }
}

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
    async jwt({ token, user, trigger, session: sessionData }) {
      if (trigger === 'update' && sessionData) {
        const update = sessionData as { accessToken?: string; refreshToken?: string }
        if (update.accessToken) {
          token.accessToken = update.accessToken
          token.refreshToken = update.refreshToken ?? token.refreshToken
          token.accessTokenExpiry = decodeJwtExpiry(update.accessToken)
          token.error = undefined
        }
        return token
      }

      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpiry = decodeJwtExpiry(user.accessToken)
        token.userId = user.id!
        token.username = user.username
        token.displayName = user.displayName
        token.avatar = user.avatar
        token.bio = user.bio
        token.role = user.role
        return token
      }

      if (!token.accessTokenExpiry && token.accessToken) {
        token.accessTokenExpiry = decodeJwtExpiry(token.accessToken)
      }

      if (token.accessTokenExpiry && Date.now() < token.accessTokenExpiry - 60_000) {
        return token
      }

      return refreshAccessToken(token)
    },

    session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.accessTokenExpiry = token.accessTokenExpiry
      session.user.id = token.userId
      session.user.username = token.username
      session.user.displayName = token.displayName
      session.user.avatar = token.avatar
      session.user.bio = token.bio
      session.user.role = token.role
      if (token.error) session.error = token.error
      return session
    },
  },

  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
