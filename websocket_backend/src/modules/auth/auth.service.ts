import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../users/user.model.js'
import { AppError } from '../../middleware/error.js'
import { getPrivateKey, getPublicKey } from '../../config/jwt.js'
import { env } from '../../config/env.js'
import { logger } from '../../shared/utils/logger.js'
import type { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schemas.js'
import type { AuthPayload } from '../../shared/types/index.js'

const BCRYPT_ROUNDS = 12

async function signAccessToken(payload: Omit<AuthPayload, 'jti' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES)
    .setJti(uuidv4())
    .sign(getPrivateKey())
}

async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES)
    .setJti(uuidv4())
    .sign(getPrivateKey())
}

export async function register(input: RegisterInput) {
  const exists = await User.findOne({
    $or: [{ email: input.email }, { username: input.username }],
  }).lean()

  if (exists) {
    const field = exists.email === input.email ? 'email' : 'username'
    throw AppError.conflict(`That ${field} is already taken`)
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
  const user = await User.create({
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    passwordHash,
  })

  const accessToken = await signAccessToken({
    sub: user.id as string,
    email: user.email,
    username: user.username,
    role: user.role,
  })
  const refreshToken = await signRefreshToken(user.id as string)
  const refreshHash = await bcrypt.hash(refreshToken, 10)
  await User.findByIdAndUpdate(user.id, { $set: { refreshTokenHash: refreshHash } })

  return { user, accessToken, refreshToken }
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash')
  if (!user) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401)

  const valid = await user.comparePassword(input.password)
  if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401)

  const accessToken = await signAccessToken({
    sub: user.id as string,
    email: user.email,
    username: user.username,
    role: user.role,
  })
  const refreshToken = await signRefreshToken(user.id as string)
  const refreshHash = await bcrypt.hash(refreshToken, 10)
  await User.findByIdAndUpdate(user.id, { $set: { refreshTokenHash: refreshHash } })

  const userObj = user.toJSON()
  return { user: userObj, accessToken, refreshToken }
}

export async function refresh(token: string) {
  let payload: { sub?: string }
  try {
    const result = await jwtVerify(token, getPublicKey(), { algorithms: ['RS256'] })
    payload = result.payload as { sub?: string }
  } catch {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired refresh token', 401)
  }

  if (!payload.sub) throw new AppError('INVALID_TOKEN', 'Malformed token', 401)

  const user = await User.findById(payload.sub).select('+refreshTokenHash')
  if (!user?.refreshTokenHash) throw new AppError('INVALID_TOKEN', 'Token revoked', 401)

  const valid = await bcrypt.compare(token, user.refreshTokenHash)
  if (!valid) throw new AppError('INVALID_TOKEN', 'Token mismatch', 401)

  const accessToken = await signAccessToken({
    sub: user.id as string,
    email: user.email,
    username: user.username,
    role: user.role,
  })
  const newRefresh = await signRefreshToken(user.id as string)
  const refreshHash = await bcrypt.hash(newRefresh, 10)
  await User.findByIdAndUpdate(user.id, { $set: { refreshTokenHash: refreshHash } })

  return { accessToken, refreshToken: newRefresh }
}

export async function logout(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '' } })
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await User.findOne({ email: input.email }).lean()
  if (!user) return

  const resetToken = await new SignJWT({ sub: user._id.toString(), email: user.email, type: 'password_reset' } as const)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .setJti(uuidv4())
    .sign(getPrivateKey())

  const origin = env.CORS_ORIGINS.split(',')[0]?.trim() ?? 'http://localhost:3000'
  const resetLink = `${origin}/reset-password?token=${resetToken}`

  logger.info({ email: input.email }, `Password reset link: ${resetLink}`)
}
export async function resetPassword(input: ResetPasswordInput) {
  let payload: { sub?: string; type?: string }
  try {
    const result = await jwtVerify(input.token, getPublicKey(), { algorithms: ['RS256'] })
    payload = result.payload as { sub?: string; type?: string }
  } catch {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired reset token', 400)
  }

  if (payload.type !== 'password_reset' || !payload.sub) {
    throw new AppError('INVALID_TOKEN', 'Malformed reset token', 400)
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  await User.findByIdAndUpdate(payload.sub, {
    $set: { passwordHash },
    $unset: { refreshTokenHash: '' },
  })

  logger.info({ userId: payload.sub }, 'Password reset successful')
}
