import { z } from 'zod'

// User schema with validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  weddingDate: z.string().datetime().optional(),
  profileImageUrl: z.string().url('Invalid profile image URL').optional(),
  partner: z.object({
    name: z.string().min(1, 'Partner name is required'),
    email: z.string().email('Invalid partner email'),
  }).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Auth schemas
// NOTE: Sign-in validation is intentionally lenient (min 6) — the server is
// the source of truth for credentials. Requiring the full signup complexity
// rules here would lock out legitimate accounts created under older policies.
export const SignInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  weddingDate: z.string().datetime().optional(),
  partner: z.object({
    name: z.string().min(1, 'Partner name is required'),
    email: z.string().email('Invalid partner email'),
  }).optional(),
})

// Type exports
export type User = z.infer<typeof UserSchema>
export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>
