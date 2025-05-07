// IndexedDB wrapper for persistent storage

const DB_NAME = "TaskManagementSystem"
const DB_VERSION = 1
const USER_STORE = "users"
const TOKEN_STORE = "tokens"

// Add initialization tracking
let isInitialized = false
let db = null

// Initialize the database
export const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Your browser doesn't support IndexedDB"))
      return
    }

    console.log(`Opening IndexedDB database: ${DB_NAME}, version: ${DB_VERSION}`)
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("IndexedDB error:", event)
      reject(new Error("Failed to open database"))
    }

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result
      console.log("IndexedDB initialized successfully")

      // Log database object stores
      const storeNames = Array.from(db.objectStoreNames)
      console.log(`Database stores: ${storeNames.join(", ")}`)

      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      console.log("Creating/upgrading database schema")

      // Create users store
      if (!db.objectStoreNames.contains(USER_STORE)) {
        const userStore = db.createObjectStore(USER_STORE, { keyPath: "email" })
        userStore.createIndex("email", "email", { unique: true })
        userStore.createIndex("id", "id", { unique: true })
        console.log("Created users store")
      } else {
        console.log("Users store already exists")
      }

      // Create tokens store
      if (!db.objectStoreNames.contains(TOKEN_STORE)) {
        const tokenStore = db.createObjectStore(TOKEN_STORE, { keyPath: "token" })
        tokenStore.createIndex("userId", "userId", { unique: false })
        console.log("Created tokens store")
      } else {
        console.log("Tokens store already exists")
      }
    }
  })
}

// Update initDB function to track initialization state
export const initDB = async (): Promise<void> => {
  if (isInitialized && db) {
    console.log("IndexedDB already initialized")
    return
  }

  try {
    db = await initializeDB()
    console.log("IndexedDB initialization successful")
    isInitialized = true

    // Verify stores exist
    const storeNames = Array.from(db.objectStoreNames)
    console.log(`Verified database stores: ${storeNames.join(", ")}`)
  } catch (error) {
    console.error("Error initializing IndexedDB:", error)
    throw error
  }
}

// Add a function to check database status
export const checkDatabaseStatus = async (): Promise<{ exists: boolean; stores: string[]; userCount: number }> => {
  try {
    if (!db) {
      await initDB()
    }

    const dbExists = !!db
    const stores = db ? Array.from(db.objectStoreNames) : []

    // Count users
    let userCount = 0
    if (dbExists && stores.includes(USER_STORE)) {
      const users = await getAllItems(USER_STORE)
      userCount = users.length
    }

    return {
      exists: dbExists,
      stores,
      userCount,
    }
  } catch (error) {
    console.error("Error checking database status:", error)
    return {
      exists: false,
      stores: [],
      userCount: 0,
    }
  }
}

// Generic function to get all items from a store
export async function getAllItems(storeName: string): Promise<any[]> {
  if (!isInitialized || !db) {
    console.log("Database not initialized, initializing now before getAllItems")
    await initDB()
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Ensure we have a valid database connection
      if (!db) {
        db = await initializeDB()
      }

      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} items from ${storeName}`)
        resolve(request.result)
      }

      request.onerror = (event) => {
        console.error(`Error getting items from ${storeName}:`, event)
        reject(new Error(`Failed to get items from ${storeName}`))
      }
    } catch (error) {
      console.error(`Error in getAllItems for ${storeName}:`, error)
      reject(error)
    }
  })
}

// Add a function to get all keys from a store
export async function getAllKeys(storeName: string): Promise<any[]> {
  if (!isInitialized || !db) {
    console.log("Database not initialized, initializing now before getAllKeys")
    await initDB()
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Ensure we have a valid database connection
      if (!db) {
        db = await initializeDB()
      }

      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} keys from ${storeName}`)
        resolve(request.result)
      }

      request.onerror = (event) => {
        console.error(`Error getting keys from ${storeName}:`, event)
        reject(new Error(`Failed to get keys from ${storeName}`))
      }
    } catch (error) {
      console.error(`Error in getAllKeys for ${storeName}:`, error)
      reject(error)
    }
  })
}

// Generic function to get an item by key
export async function getItemByKey(storeName: string, key: string): Promise<any> {
  if (!isInitialized || !db) {
    console.log("Database not initialized, initializing now before lookup")
    await initDB()
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Ensure we have a valid database connection
      if (!db) {
        db = await initializeDB()
      }

      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        if (request.result) {
          console.log(`Retrieved item from ${storeName} with key ${key}:`, request.result)
        } else {
          console.log(`No item found in ${storeName} with key ${key}`)
        }
        resolve(request.result || null)
      }

      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, event)
        reject(new Error(`Failed to get item from ${storeName}`))
      }
    } catch (error) {
      console.error(`Error in getItemByKey for ${storeName}:`, error)
      reject(error)
    }
  })
}

// Generic function to get items by index
export function getItemsByIndex(storeName: string, indexName: string, value: any) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isInitialized || !db) {
        await initDB()
      }

      // Ensure we have a valid database connection
      if (!db) {
        db = await initializeDB()
      }

      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => {
        console.log(`Retrieved ${request.result.length} items from ${storeName} by index ${indexName}`)
        resolve(request.result)
      }

      request.onerror = (event) => {
        console.error(`Error getting items by index from ${storeName}:`, event)
        reject(new Error(`Failed to get items by index from ${storeName}`))
      }
    } catch (error) {
      console.error(`Error in getItemsByIndex for ${storeName}:`, error)
      reject(error)
    }
  })
}

// Generic function to add or update an item
export function putItem(storeName: string, item: any) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isInitialized || !db) {
        await initDB()
      }

      // Ensure we have a valid database connection
      if (!db) {
        db = await initializeDB()
      }

      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)

      console.log(`Storing item in ${storeName}:`, item)
      const request = store.put(item)

      request.onsuccess = () => {
        console.log(`Successfully stored item in ${storeName} with key:`, request.result)
        resolve(item)
      }

      request.onerror = (event) => {
        console.error(`Error putting item in ${storeName}:`, event)
        reject(new Error(`Failed to put item in ${storeName}`))
      }
    } catch (error) {
      console.error(`Error in putItem for ${storeName}:`, error)
      reject(error)
    }
  })
}

// Generic function to delete an item
export function deleteItem(storeName: string, key: string) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isInitialized || !db) {
        await initDB()
      }

      // Ensure we have a valid database connection
      if (!db) {
        db = await initializeDB()
      }

      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => {
        console.log(`Successfully deleted item from ${storeName} with key ${key}`)
        resolve(true)
      }

      request.onerror = (event) => {
        console.error(`Error deleting item from ${storeName}:`, event)
        reject(new Error(`Failed to delete item from ${storeName}`))
      }
    } catch (error) {
      console.error(`Error in deleteItem for ${storeName}:`, error)
      reject(error)
    }
  })
}

// Generic function to clear a store
export function clearStore(storeName: string) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isInitialized || !db) {
        await initDB()
      }

      // Ensure we have a valid database connection
      if (!db) {
        db = await initializeDB()
      }

      const transaction = db.transaction(storeName, "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => {
        console.log(`Successfully cleared store ${storeName}`)
        resolve(true)
      }

      request.onerror = (event) => {
        console.error(`Error clearing store ${storeName}:`, event)
        reject(new Error(`Failed to clear store ${storeName}`))
      }
    } catch (error) {
      console.error(`Error in clearStore for ${storeName}:`, error)
      reject(error)
    }
  })
}

// Initialize the database when this module is imported
if (typeof window !== "undefined") {
  initDB().catch((error) => {
    console.error("Failed to initialize IndexedDB:", error)
  })
}
