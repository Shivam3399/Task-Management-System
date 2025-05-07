// Type definitions for authentication system

// User interface
export interface User {
  id: string
  name: string
  email: string
  password: string // In a real app, this would be a hashed password
  createdAt: string
  failedLoginAttempts: number
  lockedUntil: string | null // ISO date string when account is locked until
  lastLogin: string | null
}

// Token interface for IndexedDB
export interface RememberToken {
  token: string
  userId: string
  expires: string // ISO date string
}

// Interface for remembered user in localStorage
export interface RememberedUser {
  token: string
  name: string
  email: string
  initials: string
  expiresAt: string // ISO date string
  lastLogin: string // ISO date string
}

// Response interface for token validation
export interface TokenValidationResult {
  valid: boolean
  expired: boolean
  userId?: string | null
}

// Response interface for login attempt
export interface LoginResult {
  success: boolean
  expired: boolean
  message: string
}

// Interface for account lock status
export interface AccountLockStatus {
  locked: boolean
  remainingTime: number | null
}
