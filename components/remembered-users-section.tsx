"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { RememberedUsers } from "@/components/remembered-users"
import { useToast } from "@/components/ui/use-toast"

interface RememberedUsersProps {
  onSelectUser?: (user: { email: string; name: string }) => void
}

export function RememberedUsersSection({ onSelectUser }: RememberedUsersProps) {
  const [rememberedUsers, setRememberedUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadRememberedUsers = async () => {
      try {
        // Import dynamically to avoid SSR issues
        const { getRememberedUsers } = await import("@/utils/token-manager")
        const users = getRememberedUsers()
        setRememberedUsers(users)
      } catch (error) {
        console.error("Error loading remembered users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRememberedUsers()
  }, [])

  const handleUserClick = async (email: string) => {
    try {
      setIsLoading(true)

      // Find the user in the remembered users
      const user = rememberedUsers.find((u) => u.email === email)

      if (user && onSelectUser) {
        // If we're just selecting a user (in login page)
        onSelectUser(user)
        setIsLoading(false)
        return
      }

      // Otherwise try to log in with the remembered user
      const { loginWithRememberedUser } = await import("@/utils/auth-service")
      const result = await loginWithRememberedUser(email)

      if (result.success) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`,
        })
        router.push("/dashboard")
      } else if (result.expired) {
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Your session has expired. Please log in again.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Unable to log in with saved credentials. Please log in manually.",
        })
      }
    } catch (error) {
      console.error("Error logging in with remembered user:", error)
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (rememberedUsers.length === 0 || isLoading) {
    return null
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4">
        <div className="mb-2 text-sm text-muted-foreground">
          {onSelectUser ? "Select a saved account:" : "Quick login:"}
        </div>
        <RememberedUsers users={rememberedUsers} onUserClick={handleUserClick} isLoading={isLoading} />
      </CardContent>
    </Card>
  )
}
