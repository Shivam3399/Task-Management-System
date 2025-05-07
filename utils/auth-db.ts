// User authentication database using IndexedDB for persistent storage
import * as IndexedDB from "@/utils/indexed-db"

// Constants
const USER_STORE = "users"
const TOKEN_STORE = "tokens"
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

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

// Token interface
export interface RememberToken {
  token: string
  userId: string
  expires: string // ISO date string
}

// Interface for remembered user
export interface RememberedUser {
  id: string
  name: string
  email: string
  token: string
  lastLogin: string
}

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    // Make sure database is initialized
    await ensureDatabaseInitialized()

    // Log the attempt to get all users
    console.log("Attempting to get all users from database")

    // Get all users from the store
    const users = (await IndexedDB.getAllItems(USER_STORE)) as User[]

    // Log the result
    console.log(`Retrieved ${users.length} users from database:`, users)

    return users
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Add a function to ensure database is initialized before user lookup:
async function ensureDatabaseInitialized() {
  try {
    await IndexedDB.initDB()
    console.log("Database initialization confirmed before user lookup")
    return true
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return false
  }
}

// Find user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  if (!email) return null

  try {
    // Ensure database is initialized before lookup
    await ensureDatabaseInitialized()

    const normalizedEmail = email.trim().toLowerCase()
    console.log(`Looking up user with email: ${normalizedEmail}`)

    const user = (await IndexedDB.getItemByKey(USER_STORE, normalizedEmail)) as User | null

    // For debugging
    console.log("User lookup result:", user ? "Found" : "Not found", "for email:", normalizedEmail)
    if (!user) {
      console.log("User not found in database. This could indicate an initialization issue.")
    }

    return user
  } catch (error) {
    console.error("Error finding user by email:", error)
    return null
  }
}

// Create a new user
export const createUser = async (
  userData: Omit<User, "id" | "createdAt" | "failedLoginAttempts" | "lockedUntil" | "lastLogin">,
): Promise<User> => {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized()

    // Normalize email
    const normalizedEmail = userData.email.trim().toLowerCase()

    // Check if user already exists
    const existingUser = await findUserByEmail(normalizedEmail)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const newUser: User = {
      ...userData,
      email: normalizedEmail, // Normalize email
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: null,
    }

    // Log the user we're about to create
    console.log("Creating new user:", newUser)

    // Store the user in IndexedDB
    await IndexedDB.putItem(USER_STORE, newUser)

    // Verify the user was stored
    const storedUser = await findUserByEmail(normalizedEmail)
    console.log("User created successfully:", storedUser ? "Verified" : "Failed to verify")

    // Check user count after creation
    const allUsers = await getAllUsers()
    console.log(`Total user count after creation: ${allUsers.length}`)

    return newUser
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Update user
export const updateUser = async (email: string, updates: Partial<User>): Promise<User> => {
  try {
    const normalizedEmail = email.trim().toLowerCase()
    const user = (await IndexedDB.getItemByKey(USER_STORE, normalizedEmail)) as User | null

    if (!user) {
      throw new Error("User not found")
    }

    const updatedUser = { ...user, ...updates }
    await IndexedDB.putItem(USER_STORE, updatedUser)

    return updatedUser
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

// Delete user
export const deleteUser = async (email: string): Promise<boolean> => {
  try {
    const normalizedEmail = email.trim().toLowerCase()
    await IndexedDB.deleteItem(USER_STORE, normalizedEmail)
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// Record failed login attempt
export const recordFailedLoginAttempt = async (
  email: string,
): Promise<{ isLocked: boolean; lockoutTime: number | null }> => {
  try {
    const user = await findUserByEmail(email)
    if (!user) return { isLocked: false, lockoutTime: null }

    const updatedAttempts = user.failedLoginAttempts + 1
    let isLocked = false
    let lockoutTime = null

    if (updatedAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCKOUT_DURATION)
      await updateUser(email, {
        failedLoginAttempts: 0,
        lockedUntil: lockUntil.toISOString(),
      })
      isLocked = true
      lockoutTime = LOCKOUT_DURATION / 1000 // in seconds
    } else {
      await updateUser(email, { failedLoginAttempts: updatedAttempts })
    }

    return { isLocked, lockoutTime }
  } catch (error) {
    console.error("Error recording failed login attempt:", error)
    return { isLocked: false, lockoutTime: null }
  }
}

// Reset failed login attempts
export const resetFailedLoginAttempts = async (email: string): Promise<void> => {
  try {
    const user = await findUserByEmail(email)
    if (user) {
      await updateUser(email, {
        failedLoginAttempts: 0,
        lastLogin: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error resetting failed login attempts:", error)
  }
}

// Check if account is locked
export const isAccountLocked = async (email: string): Promise<{ locked: boolean; remainingTime: number | null }> => {
  try {
    const user = await findUserByEmail(email)
    if (!user || !user.lockedUntil) return { locked: false, remainingTime: null }

    const now = new Date()
    const lockedUntil = new Date(user.lockedUntil)

    if (now < lockedUntil) {
      const remainingMs = lockedUntil.getTime() - now.getTime()
      return {
        locked: true,
        remainingTime: Math.ceil(remainingMs / 1000), // in seconds
      }
    }

    // If lock has expired, clear it
    await updateUser(email, { lockedUntil: null })
    return { locked: false, remainingTime: null }
  } catch (error) {
    console.error("Error checking if account is locked:", error)
    return { locked: false, remainingTime: null }
  }
}

// Password validation
export const validatePasswordStrength = (
  password: string,
): {
  isValid: boolean
  score: number // 0-4 (0: very weak, 4: very strong)
  feedback: {
    hasMinLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
    startsWithUppercase: boolean
  }
} => {
  const minLength = 8
  const hasMinLength = password.length >= minLength
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const startsWithUppercase = /^[A-Z]/.test(password)

  // Calculate score (0-4)
  let score = 0
  if (hasMinLength) score++
  if (hasUppercase && hasLowercase) score++
  if (hasNumber) score++
  if (hasSpecialChar) score++

  // Minimum requirements for validity
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && startsWithUppercase

  return {
    isValid,
    score,
    feedback: {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      startsWithUppercase,
    },
  }
}

// Generate a remember me token
export const generateRememberToken = (userId: string): string => {
  // In a real app, this would be a secure token
  return `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Store remember me token
export const storeRememberToken = async (token: string, userId: string): Promise<void> => {
  try {
    // Store token with 30-day expiration
    const expiration = new Date()
    expiration.setDate(expiration.getDate() + 30)

    const tokenData: RememberToken = {
      token,
      userId,
      expires: expiration.toISOString(),
    }

    await IndexedDB.putItem(TOKEN_STORE, tokenData)
  } catch (error) {
    console.error("Error storing remember token:", error)
  }
}

// Validate remember me token
export const validateRememberToken = async (
  token: string,
): Promise<{ valid: boolean; userId: string | null; expired: boolean }> => {
  try {
    const tokenData = (await IndexedDB.getItemByKey(TOKEN_STORE, token)) as RememberToken | null
    if (!tokenData) return { valid: false, userId: null, expired: false }

    // Check if token has expired
    const now = new Date()
    const expires = new Date(tokenData.expires)

    if (now > expires) {
      // Token has expired
      await IndexedDB.deleteItem(TOKEN_STORE, token)
      return { valid: false, userId: null, expired: true }
    }

    return { valid: true, userId: tokenData.userId, expired: false }
  } catch (error) {
    console.error("Error validating remember token:", error)
    return { valid: false, userId: null, expired: false }
  }
}

// Remove remember me token
export const removeRememberToken = async (token: string): Promise<void> => {
  try {
    await IndexedDB.deleteItem(TOKEN_STORE, token)
  } catch (error) {
    console.error("Error removing remember token:", error)
  }
}

// Get all remembered users
export const getRememberedUsers = (): RememberedUser[] => {
  if (typeof window === "undefined") return []

  const rememberedUsers = localStorage.getItem("remembered_users")
  return rememberedUsers ? JSON.parse(rememberedUsers) : []
}

// Save a remembered user
export const saveRememberedUser = async (user: User, token: string): Promise<void> => {
  try {
    // Get existing remembered users
    const rememberedUsers = getRememberedUsers()

    // Check if user is already remembered
    const existingIndex = rememberedUsers.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase())

    const rememberedUser: RememberedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      token: token,
      lastLogin: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      // Update existing user
      rememberedUsers[existingIndex] = rememberedUser
    } else {
      // Add new user
      rememberedUsers.push(rememberedUser)
    }

    // Save to localStorage
    localStorage.setItem("remembered_users", JSON.stringify(rememberedUsers))

    // Also store the token in IndexedDB for validation
    await storeRememberToken(token, user.id)

    // Set current remember token
    localStorage.setItem("remember_token", token)
  } catch (error) {
    console.error("Error saving remembered user:", error)
  }
}

// Remove a remembered user
export const removeRememberedUser = async (email: string): Promise<void> => {
  try {
    // Get existing remembered users
    const rememberedUsers = getRememberedUsers()

    // Find the user to remove
    const userToRemove = rememberedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (userToRemove) {
      // Remove the token from IndexedDB
      await removeRememberToken(userToRemove.token)

      // Filter out the user
      const updatedUsers = rememberedUsers.filter((u) => u.email.toLowerCase() !== email.toLowerCase())

      // Save updated list
      localStorage.setItem("remembered_users", JSON.stringify(updatedUsers))

      // If this was the current remembered user, clear the token
      const currentToken = localStorage.getItem("remember_token")
      if (currentToken === userToRemove.token) {
        localStorage.removeItem("remember_token")
      }
    }
  } catch (error) {
    console.error("Error removing remembered user:", error)
  }
}

// Get user initials for avatar
export const getUserInitials = (name: string): string => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Login with remembered user
export const loginWithRememberedUser = async (email: string): Promise<{ success: boolean; expired: boolean }> => {
  try {
    // Get remembered users
    const rememberedUsers = getRememberedUsers()
    const rememberedUser = rememberedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!rememberedUser) return { success: false, expired: false }

    // Validate the token
    const { valid, userId, expired } = await validateRememberToken(rememberedUser.token)

    if (expired) {
      // Token is expired, remove the remembered user
      await removeRememberedUser(email)
      return { success: false, expired: true }
    }

    if (!valid || !userId) {
      // Token is invalid for other reasons
      await removeRememberedUser(email)
      return { success: false, expired: false }
    }

    // Get the user from IndexedDB
    const user = await findUserByEmail(email)
    if (!user) return { success: false, expired: false }

    // Set authentication data
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userName", user.name)
    localStorage.setItem("userEmail", user.email)
    localStorage.setItem("remember_token", rememberedUser.token)

    // Update last login time
    await updateUser(email, {
      lastLogin: new Date().toISOString(),
    })

    // Update remembered user's last login
    rememberedUser.lastLogin = new Date().toISOString()
    localStorage.setItem(
      "remembered_users",
      JSON.stringify(rememberedUsers.map((u) => (u.email.toLowerCase() === email.toLowerCase() ? rememberedUser : u))),
    )

    return { success: true, expired: false }
  } catch (error) {
    console.error("Error logging in with remembered user:", error)
    return { success: false, expired: false }
  }
}

// Add a function to validate all remembered users on page load
export const validateAllRememberedUsers = async (): Promise<void> => {
  try {
    const rememberedUsers = getRememberedUsers()
    if (rememberedUsers.length === 0) return

    const validatedUsers = []
    let hasRemovedUsers = false

    for (const user of rememberedUsers) {
      const { valid, expired } = await validateRememberToken(user.token)
      if (valid) {
        validatedUsers.push(user)
      } else {
        hasRemovedUsers = true
        console.log(`Removing expired or invalid token for user: ${user.email}`)
      }
    }

    if (hasRemovedUsers) {
      localStorage.setItem("remembered_users", JSON.stringify(validatedUsers))
    }
  } catch (error) {
    console.error("Error validating remembered users:", error)
  }
}

// Migrate existing users from localStorage to IndexedDB
export const migrateExistingUsers = async (): Promise<void> => {
  try {
    console.log("Starting migration of existing users from localStorage to IndexedDB")

    // Check for old localStorage format
    const email = localStorage.getItem("userEmail")
    const password = localStorage.getItem("userPassword")
    const name = localStorage.getItem("userName")

    if (email && password) {
      // Check if user already exists in IndexedDB
      const existingUser = await findUserByEmail(email)

      if (!existingUser) {
        console.log("Migrating user from localStorage:", email)

        await createUser({
          name: name || "User",
          email,
          password,
        })

        console.log("Successfully migrated user from localStorage:", email)
      } else {
        console.log("User already exists in IndexedDB:", email)
      }
    } else {
      console.log("No users found in localStorage to migrate")
    }

    // Check for old auth_users in localStorage
    const oldUsers = localStorage.getItem("auth_users")
    if (oldUsers) {
      try {
        const parsedUsers = JSON.parse(oldUsers) as User[]
        console.log(`Found ${parsedUsers.length} users in localStorage auth_users`)

        for (const user of parsedUsers) {
          const existingUser = await findUserByEmail(user.email)

          if (!existingUser) {
            console.log("Migrating user from auth_users:", user.email)
            await IndexedDB.putItem(USER_STORE, {
              ...user,
              email: user.email.trim().toLowerCase(), // Normalize email
            })
            console.log("Successfully migrated user from auth_users:", user.email)
          } else {
            console.log("User already exists in IndexedDB:", user.email)
          }
        }
      } catch (error) {
        console.error("Error parsing auth_users from localStorage:", error)
      }
    }

    console.log("Migration completed")
  } catch (error) {
    console.error("Error during migration:", error)
  }
}

// Initialize and migrate on import
if (typeof window !== "undefined") {
  // Wait for DOM to be ready to ensure IndexedDB is available
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("DOM loaded, initializing auth database")
      ensureDatabaseInitialized().then(() => {
        migrateExistingUsers()
      })
    })
  } else {
    console.log("DOM already loaded, initializing auth database")
    ensureDatabaseInitialized().then(() => {
      migrateExistingUsers()
    })
  }
}
