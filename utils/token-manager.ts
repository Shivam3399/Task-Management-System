// Token generation and validation utilities
import { v4 as uuidv4 } from "uuid"
import type { RememberedUser } from "./auth-types"

// Constants
const REMEMBER_ME_STORAGE_KEY = "remembered_users"
const TOKEN_EXPIRY_DAYS = 30

// Generate a secure token with UUID
export const generateToken = (): string => {
  return uuidv4()
}

// Calculate expiration date (30 days from now)
export const calculateExpiryDate = (): string => {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS)
  return expiryDate.toISOString()
}

// Check if a token is expired
export const isTokenExpired = (expiryDateString: string): boolean => {
  const expiryDate = new Date(expiryDateString)
  const now = new Date()
  return now > expiryDate
}

// Get user initials from name
export const getUserInitials = (name: string): string => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Get all remembered users from localStorage
export const getRememberedUsers = (): RememberedUser[] => {
  if (typeof window === "undefined") return []

  try {
    const storedData = localStorage.getItem(REMEMBER_ME_STORAGE_KEY)
    if (!storedData) return []

    return JSON.parse(storedData)
  } catch (error) {
    console.error("Error retrieving remembered users:", error)
    return []
  }
}

// Save a remembered user to localStorage
export const saveRememberedUser = (user: RememberedUser): void => {
  if (typeof window === "undefined") return

  try {
    // Get existing users
    const existingUsers = getRememberedUsers()

    // Check if user already exists
    const existingIndex = existingUsers.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase())

    if (existingIndex >= 0) {
      // Update existing user
      existingUsers[existingIndex] = user
    } else {
      // Add new user
      existingUsers.push(user)
    }

    // Save back to localStorage
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, JSON.stringify(existingUsers))
  } catch (error) {
    console.error("Error saving remembered user:", error)
  }
}

// Remove a remembered user from localStorage
export const removeRememberedUser = (email: string): void => {
  if (typeof window === "undefined") return

  try {
    // Get existing users
    const existingUsers = getRememberedUsers()

    // Filter out the user to remove
    const updatedUsers = existingUsers.filter((u) => u.email.toLowerCase() !== email.toLowerCase())

    // Save back to localStorage
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, JSON.stringify(updatedUsers))
  } catch (error) {
    console.error("Error removing remembered user:", error)
  }
}

// Validate all remembered users and remove expired ones
export const validateAndCleanupRememberedUsers = (): RememberedUser[] => {
  if (typeof window === "undefined") return []

  try {
    const allUsers = getRememberedUsers()
    const validUsers = allUsers.filter((user) => !isTokenExpired(user.expiresAt))

    // If we removed any users, update localStorage
    if (validUsers.length !== allUsers.length) {
      localStorage.setItem(REMEMBER_ME_STORAGE_KEY, JSON.stringify(validUsers))
    }

    return validUsers
  } catch (error) {
    console.error("Error validating remembered users:", error)
    return []
  }
}

// Find a remembered user by token
export const findRememberedUserByToken = (token: string): RememberedUser | null => {
  const users = getRememberedUsers()
  return users.find((user) => user.token === token) || null
}

// Find a remembered user by email
export const findRememberedUserByEmail = (email: string): RememberedUser | null => {
  const users = getRememberedUsers()
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null
}

// Update a remembered user's last login time
export const updateRememberedUserLastLogin = (email: string): void => {
  const users = getRememberedUsers()
  const userIndex = users.findIndex((user) => user.email.toLowerCase() === email.toLowerCase())

  if (userIndex >= 0) {
    users[userIndex].lastLogin = new Date().toISOString()
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, JSON.stringify(users))
  }
}
