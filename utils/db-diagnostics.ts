import * as IndexedDB from "@/utils/indexed-db"

// Constants
const USER_STORE = "users"
const TOKEN_STORE = "tokens"

// Function to diagnose database issues
export async function diagnoseDatabaseIssues() {
  try {
    console.log("Starting database diagnostics...")

    // Check if database exists
    const status = await IndexedDB.checkDatabaseStatus()
    console.log("Database status:", status)

    if (!status.exists) {
      console.error("Database does not exist!")
      return {
        status: "error",
        message: "Database does not exist",
        details: status,
      }
    }

    // Check if stores exist
    if (!status.stores.includes(USER_STORE) || !status.stores.includes(TOKEN_STORE)) {
      console.error("Required stores are missing!")
      return {
        status: "error",
        message: "Required stores are missing",
        details: status,
      }
    }

    // Check user count
    if (status.userCount === 0) {
      console.warn("No users found in database")
      return {
        status: "warning",
        message: "No users found in database",
        details: status,
      }
    }

    // Get all users for inspection
    const users = await IndexedDB.getAllItems(USER_STORE)
    console.log("Users in database:", users)

    // Check for user data integrity
    const invalidUsers = users.filter((user) => !user.email || !user.id || !user.name)
    if (invalidUsers.length > 0) {
      console.error("Found users with invalid data:", invalidUsers)
      return {
        status: "error",
        message: "Found users with invalid data",
        details: {
          invalidUsers,
          status,
        },
      }
    }

    return {
      status: "ok",
      message: "Database appears to be healthy",
      details: {
        users,
        status,
      },
    }
  } catch (error) {
    console.error("Error during database diagnostics:", error)
    return {
      status: "error",
      message: "Error during database diagnostics",
      details: error,
    }
  }
}

// Function to fix common database issues
export async function fixDatabaseIssues() {
  try {
    console.log("Attempting to fix database issues...")

    // First, diagnose issues
    const diagnosis = await diagnoseDatabaseIssues()
    console.log("Diagnosis result:", diagnosis)

    if (diagnosis.status === "ok") {
      return {
        status: "ok",
        message: "No issues to fix",
        details: diagnosis,
      }
    }

    // Reinitialize database if it doesn't exist
    if (!diagnosis.details.status?.exists) {
      await IndexedDB.initDB()
      console.log("Database reinitialized")
    }

    // Check if we need to migrate users from localStorage
    const { migrateExistingUsers } = await import("@/utils/auth-db")
    await migrateExistingUsers()
    console.log("User migration attempted")

    // Check database status after fixes
    const newStatus = await IndexedDB.checkDatabaseStatus()
    console.log("Database status after fixes:", newStatus)

    return {
      status: "fixed",
      message: "Database issues fixed",
      details: {
        before: diagnosis,
        after: newStatus,
      },
    }
  } catch (error) {
    console.error("Error fixing database issues:", error)
    return {
      status: "error",
      message: "Error fixing database issues",
      details: error,
    }
  }
}

// Function to reset database (use with caution)
export async function resetDatabase() {
  try {
    console.log("Resetting database...")

    // Clear all stores
    await IndexedDB.clearStore(USER_STORE)
    await IndexedDB.clearStore(TOKEN_STORE)

    // Clear localStorage items related to authentication
    localStorage.removeItem("user_session")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("remember_token")
    localStorage.removeItem("remembered_users")

    console.log("Database reset complete")

    return {
      status: "ok",
      message: "Database reset complete",
    }
  } catch (error) {
    console.error("Error resetting database:", error)
    return {
      status: "error",
      message: "Error resetting database",
      details: error,
    }
  }
}
