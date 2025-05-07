// Authentication service for handling login, logout, and session management
import type { User, RememberedUser, LoginResult, AccountLockStatus } from "./auth-types"
import {
  generateToken,
  calculateExpiryDate,
  getUserInitials,
  saveRememberedUser,
  removeRememberedUser,
  updateRememberedUserLastLogin,
  isTokenExpired,
  findRememberedUserByEmail,
} from "./token-manager"

// Constants
const SESSION_STORAGE_KEY = "user_session"
const CURRENT_TOKEN_KEY = "current_token"
const USER_DATABASE_KEY = "user_database"

// Load mock database from localStorage or use initial data
const loadMockUserDatabase = (): User[] => {
  if (typeof window === "undefined") {
    return [
      {
        id: "1",
        name: "Demo User",
        email: "demo@example.com",
        password: "password",
        createdAt: "2023-01-01T00:00:00Z",
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: null,
      },
      {
        id: "2",
        name: "Ravi Kumar",
        email: "ravi@example.com",
        password: "password123",
        createdAt: "2023-02-15T00:00:00Z",
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: null,
      },
    ]
  }

  try {
    const storedData = localStorage.getItem(USER_DATABASE_KEY)
    if (storedData) {
      return JSON.parse(storedData)
    }
  } catch (error) {
    console.error("Error loading user database:", error)
  }

  // Initial data if nothing in localStorage
  const initialData = [
    {
      id: "1",
      name: "Demo User",
      email: "demo@example.com",
      password: "password",
      createdAt: "2023-01-01T00:00:00Z",
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: null,
    },
    {
      id: "2",
      name: "Ravi Kumar",
      email: "ravi@example.com",
      password: "password123",
      createdAt: "2023-02-15T00:00:00Z",
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: null,
    },
  ]

  // Save initial data to localStorage
  localStorage.setItem(USER_DATABASE_KEY, JSON.stringify(initialData))
  return initialData
}

// Initialize the mock database
const mockUserDatabase = loadMockUserDatabase()

// Function to save the mock database to localStorage
const saveMockUserDatabase = (): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_DATABASE_KEY, JSON.stringify(mockUserDatabase))
  }
}

// Add a function to create a new user in the database
export const createUser = async (
  userData: Omit<User, "id" | "createdAt" | "failedLoginAttempts" | "lockedUntil" | "lastLogin">,
): Promise<User> => {
  // Check if user already exists
  const existingUser = await findUserByEmail(userData.email)
  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  // Create new user
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLogin: null,
  }

  // Add to mock database
  mockUserDatabase.push(newUser)

  // Save to localStorage
  saveMockUserDatabase()

  return newUser
}

// Update the findUserByEmail function to log the search results
export const findUserByEmail = async (email: string): Promise<User | null> => {
  if (!email) return null

  const normalizedEmail = email.toLowerCase().trim()
  const user = mockUserDatabase.find((u) => u.email.toLowerCase() === normalizedEmail)

  console.log(`Looking for user with email ${normalizedEmail}:`, user ? "Found" : "Not found")
  if (!user) {
    console.log("Current database:", mockUserDatabase)
  }

  return user || null
}

// Check if account is locked
export const isAccountLocked = async (email: string): Promise<AccountLockStatus> => {
  const user = await findUserByEmail(email)

  if (!user || !user.lockedUntil) {
    return { locked: false, remainingTime: null }
  }

  const now = new Date()
  const lockedUntil = new Date(user.lockedUntil)

  if (now < lockedUntil) {
    const remainingMs = lockedUntil.getTime() - now.getTime()
    return {
      locked: true,
      remainingTime: Math.ceil(remainingMs / 1000), // in seconds
    }
  }

  // Lock has expired
  return { locked: false, remainingTime: null }
}

// Update the recordFailedLoginAttempt function to save changes
export const recordFailedLoginAttempt = async (email: string): Promise<AccountLockStatus> => {
  const user = await findUserByEmail(email)
  if (!user) return { locked: false, remainingTime: null }

  // Update failed attempts
  user.failedLoginAttempts += 1

  const MAX_ATTEMPTS = 5
  const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCKOUT_DURATION)
    user.lockedUntil = lockUntil.toISOString()
    user.failedLoginAttempts = 0

    // Save changes
    saveMockUserDatabase()

    return {
      locked: true,
      remainingTime: LOCKOUT_DURATION / 1000, // in seconds
    }
  }

  // Save changes
  saveMockUserDatabase()

  return { locked: false, remainingTime: null }
}

// Update the resetFailedLoginAttempts function to save changes
export const resetFailedLoginAttempts = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email)
  if (user) {
    user.failedLoginAttempts = 0
    user.lastLogin = new Date().toISOString()

    // Save changes
    saveMockUserDatabase()
  }
}

// Login with email and password
export const login = async (email: string, password: string, rememberMe: boolean): Promise<LoginResult> => {
  try {
    // Check if account is locked
    const lockStatus = await isAccountLocked(email)
    if (lockStatus.locked) {
      return {
        success: false,
        expired: false,
        message: `Account is temporarily locked. Please try again later.`,
      }
    }

    // Find user
    const user = await findUserByEmail(email)

    // Validate credentials
    if (!user || user.password !== password) {
      await recordFailedLoginAttempt(email)
      return {
        success: false,
        expired: false,
        message: "Invalid email or password.",
      }
    }

    // Reset failed login attempts
    await resetFailedLoginAttempts(email)

    // Create session
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    }

    // Store session
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

    // Add this line to explicitly store the email
    localStorage.setItem("userEmail", user.email)
    localStorage.setItem("userName", user.name)

    // Handle remember me
    if (rememberMe) {
      const token = generateToken()
      const expiresAt = calculateExpiryDate()
      const initials = getUserInitials(user.name)

      const rememberedUser: RememberedUser = {
        token,
        name: user.name,
        email: user.email,
        initials,
        expiresAt,
        lastLogin: new Date().toISOString(),
      }

      // Save remembered user
      saveRememberedUser(rememberedUser)

      // Store current token
      localStorage.setItem(CURRENT_TOKEN_KEY, token)
    }

    return {
      success: true,
      expired: false,
      message: "Login successful.",
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      expired: false,
      message: "An error occurred during login.",
    }
  }
}

// Login with remembered user
export const loginWithRememberedUser = async (email: string): Promise<LoginResult> => {
  try {
    // Find remembered user
    const rememberedUser = findRememberedUserByEmail(email)

    if (!rememberedUser) {
      return {
        success: false,
        expired: false,
        message: "Remembered user not found.",
      }
    }

    // Check if token is expired
    if (isTokenExpired(rememberedUser.expiresAt)) {
      // Remove expired user
      removeRememberedUser(email)

      return {
        success: false,
        expired: true,
        message: "Session expired. Please log in again.",
      }
    }

    // Find user in database
    const user = await findUserByEmail(email)

    if (!user) {
      // User no longer exists in database
      removeRememberedUser(email)

      return {
        success: false,
        expired: false,
        message: "User account no longer exists.",
      }
    }

    // Create session
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    }

    // Store session
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

    // Add this line to explicitly store the email
    localStorage.setItem("userEmail", user.email)
    localStorage.setItem("userName", user.name)

    // Store current token
    localStorage.setItem(CURRENT_TOKEN_KEY, rememberedUser.token)

    // Update last login time
    updateRememberedUserLastLogin(email)

    return {
      success: true,
      expired: false,
      message: "Login successful.",
    }
  } catch (error) {
    console.error("Error logging in with remembered user:", error)
    return {
      success: false,
      expired: false,
      message: "An error occurred during login.",
    }
  }
}

// Logout
export const logout = async (): Promise<void> => {
  try {
    // Clear session data but keep remembered users and user database
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(CURRENT_TOKEN_KEY)
    localStorage.removeItem("isAuthenticated")

    // Don't remove these during logout as they might affect IndexedDB initialization
    // localStorage.removeItem("userEmail");
    // localStorage.removeItem("userName");

    console.log("User logged out successfully, user data preserved")
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  try {
    // First check the explicit flag for faster response
    const explicitAuth = localStorage.getItem("isAuthenticated") === "true"
    if (explicitAuth) {
      console.log("User is authenticated via explicit flag")
      return true
    }

    // Then check session data
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!sessionData) {
      console.log("No session data found")
      return false
    }

    const session = JSON.parse(sessionData)
    const isAuth = session.isAuthenticated === true

    console.log("Session authentication status:", isAuth)

    // If authenticated via session, set the explicit flag for future checks
    if (isAuth) {
      localStorage.setItem("isAuthenticated", "true")
    }

    return isAuth
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}

// Get current user
export const getCurrentUser = (): { id: string; name: string; email: string } | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!sessionData) return null

    const session = JSON.parse(sessionData)
    return {
      id: session.id,
      name: session.name,
      email: session.email,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Format lockout time for display
export const formatLockoutTime = (seconds: number | null): string => {
  if (!seconds) return "some time"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} and ${remainingSeconds} second${
      remainingSeconds !== 1 ? "s" : ""
    }`
  }

  return `${seconds} second${seconds !== 1 ? "s" : ""}`
}
