'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getUserNotifications, markNotificationAsRead } from '@/app/actions/notifications'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      // In a real app, get the current user ID from authentication
      const currentUserId = 'currentUser'
      const userNotifications = await getUserNotifications(currentUserId)
      setNotifications(userNotifications)
      setUnreadCount(userNotifications.filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
    
    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])
  
  // Mark notification as read and navigate to related task
  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationAsRead(notification.id)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      // Navigate to related task if available
      if (notification.related_id && notification.type === 'task_assigned') {
        router.push(`/tasks/${notification.related_id}`)
      }
    } catch (error) {
      console.error('Error handling notification:', error)
    }
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted transition-colors ${
                  !notification.is_read ? 'bg-muted/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{notification.message}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
