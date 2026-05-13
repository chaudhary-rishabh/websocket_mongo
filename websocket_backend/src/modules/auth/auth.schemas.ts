import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  displayName: z.string().trim().min(1).max(60),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RefreshInput = z.infer<typeof RefreshSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
