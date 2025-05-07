"use client"

import { useState, useEffect } from "react"
import { X, Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: "task" | "system" | "message"
  recipientId: string
  relatedId?: string // Added for task navigation
}

export function TaskNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const router = useRouter()

  // Auto-close timeout in milliseconds
  const autoCloseTimeout = 5000 // Increased to 5 seconds for better usability

  // Get current user and update when it changes
  useEffect(() => {
    const getCurrentUser = () => {
      if (typeof window === "undefined") return null
      return localStorage.getItem("userEmail")
    }

    // Set initial value
    setCurrentUser(getCurrentUser())

    // Check for changes every second (for demo purposes)
    const interval = setInterval(() => {
      const newUser = getCurrentUser()
      if (newUser !== currentUser) {
        setCurrentUser(newUser)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentUser])

  // Get notifications from localStorage
  useEffect(() => {
    if (!currentUser) return

    const getNotifications = () => {
      if (typeof window === "undefined") return []

      console.log("Getting notifications for user:", currentUser)

      const storedNotifications = localStorage.getItem("user_notifications")
      if (!storedNotifications) return []

      try {
        const allNotifications = JSON.parse(storedNotifications)
        console.log("All notifications:", allNotifications)

        // Filter notifications to only show those for the current user
        const userNotifications = allNotifications.filter(
          (notification) => notification.recipientId === currentUser || notification.type === "system",
        )
        console.log("User notifications:", userNotifications)

        return userNotifications
      } catch (error) {
        console.error("Error parsing notifications:", error)
        return []
      }
    }

    const updateNotifications = () => {
      const userNotifications = getNotifications()
      setNotifications(userNotifications)
    }

    updateNotifications()

    // Check for new notifications every 5 seconds
    const interval = setInterval(updateNotifications, 5000)

    // Listen for storage events (when notifications are added from another tab)
    const handleStorageChange = (e) => {
      if (e.key === "user_notifications") {
        updateNotifications()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [currentUser])

  // Auto-close notifications after a certain period
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (showNotifications) {
      timer = setTimeout(() => {
        setShowNotifications(false)
      }, autoCloseTimeout)
    }

    // Clear timeout when component unmounts or when notifications are closed manually
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showNotifications, autoCloseTimeout])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    if (!currentUser) return

    const storedNotifications = localStorage.getItem("user_notifications")
    if (!storedNotifications) return

    try {
      const allNotifications = JSON.parse(storedNotifications)
      const updatedNotifications = allNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      )

      localStorage.setItem("user_notifications", JSON.stringify(updatedNotifications))

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = () => {
    if (!currentUser) return

    const storedNotifications = localStorage.getItem("user_notifications")
    if (!storedNotifications) return

    try {
      const allNotifications = JSON.parse(storedNotifications)
      const updatedNotifications = allNotifications.map((notification) =>
        notification.recipientId === currentUser ? { ...notification, read: true } : notification,
      )

      localStorage.setItem("user_notifications", JSON.stringify(updatedNotifications))

      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = (id: string) => {
    const storedNotifications = localStorage.getItem("user_notifications")
    if (!storedNotifications) return

    try {
      const allNotifications = JSON.parse(storedNotifications)
      const updatedNotifications = allNotifications.filter((notification) => notification.id !== id)

      localStorage.setItem("user_notifications", JSON.stringify(updatedNotifications))

      // Update local state
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const clearAllNotifications = () => {
    if (!currentUser) return

    const storedNotifications = localStorage.getItem("user_notifications")
    if (!storedNotifications) return

    try {
      const allNotifications = JSON.parse(storedNotifications)
      // Only remove notifications for the current user
      const updatedNotifications = allNotifications.filter((notification) => notification.recipientId !== currentUser)

      localStorage.setItem("user_notifications", JSON.stringify(updatedNotifications))

      // Update local state
      setNotifications([])
    } catch (error) {
      console.error("Error clearing notifications:", error)
    }
  }

  // Handle notification click - navigate to related content if available
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id)

    // Navigate to related content if available
    if (notification.relatedId) {
      if (notification.type === "task") {
        router.push(`/tasks/${notification.relatedId}`)
        setShowNotifications(false) // Close notification panel
      }
    }
  }

  const addTestNotification = () => {
    if (!currentUser) return

    const userName = localStorage.getItem("userName") || "User"

    // Create a test notification for the current user
    addNotification({
      title: "Test Notification",
      message: `This is a test notification for ${userName}`,
      type: "task",
      recipientId: currentUser,
      relatedId: "1", // Replace with an actual task ID
    })
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                Notifications {currentUser ? `(${currentUser})` : ""}
              </CardTitle>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs">
                      Mark all read
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="h-7 text-xs">
                      Clear all
                    </Button>
                  </>
                )}
                {/* Test button - remove in production */}
                <Button variant="outline" size="sm" onClick={addTestNotification} className="h-7 text-xs">
                  Test
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {!currentUser ? (
              <p className="text-center text-muted-foreground py-4">Please log in to see notifications</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded-md relative ${notification.read ? "bg-background" : "bg-muted"} ${
                      notification.relatedId ? "cursor-pointer" : ""
                    }`}
                    onClick={notification.relatedId ? () => handleNotificationClick(notification) : undefined}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent triggering parent click
                          deleteNotification(notification.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent triggering parent click
                            markAsRead(notification.id)
                          }}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper function to add a new notification
export function addNotification(
  notification: Omit<Notification, "id" | "timestamp" | "read"> & { recipientId: string },
) {
  if (typeof window === "undefined") return

  const storedNotifications = localStorage.getItem("user_notifications")
  let notifications: Notification[] = []

  if (storedNotifications) {
    try {
      notifications = JSON.parse(storedNotifications)
    } catch (error) {
      console.error("Error parsing notifications:", error)
    }
  }

  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    read: false,
  }

  notifications.unshift(newNotification)
  console.log("Adding notification:", newNotification)
  console.log("All notifications after adding:", notifications)

  localStorage.setItem("user_notifications", JSON.stringify(notifications))

  // Dispatch storage event to notify other tabs
  window.dispatchEvent(new Event("storage"))

  return newNotification
}

// Helper function to create a task assignment notification
export function createTaskAssignmentNotification(taskId: string, taskTitle: string, assigneeId: string) {
  // Get current user name from localStorage
  const currentUser = localStorage.getItem("userName") || "A team member"

  console.log(`Creating task assignment notification from ${currentUser} to ${assigneeId} for task ${taskTitle}`)

  return addNotification({
    title: "New Task Assignment",
    message: `${currentUser} assigned you the task: ${taskTitle}`,
    type: "task",
    recipientId: assigneeId,
    relatedId: taskId,
  })
}

// Helper function to create a task update notification
export function createTaskUpdateNotification(taskId: string, taskTitle: string, assigneeId: string) {
  const currentUser = localStorage.getItem("userName") || "A team member"

  console.log(`Creating task update notification from ${currentUser} to ${assigneeId} for task ${taskTitle}`)

  return addNotification({
    title: "Task Updated",
    message: `${currentUser} updated the task: ${taskTitle}`,
    type: "task",
    recipientId: assigneeId,
    relatedId: taskId,
  })
}
