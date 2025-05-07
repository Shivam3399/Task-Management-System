"use client"

import { useEffect, useState } from "react"
import { RememberedUserIcon } from "@/components/remembered-user-icon"
import {
  type RememberedUser,
  getRememberedUsers,
  removeRememberedUser,
  loginWithRememberedUser,
  validateAllRememberedUsers,
} from "@/utils/auth-db"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function RememberedUsers() {
  const [rememberedUsers, setRememberedUsers] = useState<RememberedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Validate all remembered users on component mount
    const validateUsers = async () => {
      setIsValidating(true)
      try {
        // First validate all tokens and remove expired ones
        await validateAllRememberedUsers()

        // Then load the remaining valid users
        const users = getRememberedUsers()
        setRememberedUsers(users)
      } catch (error) {
        console.error("Error validating remembered users:", error)
      } finally {
        setIsValidating(false)
      }
    }

    validateUsers()
  }, [])

  const handleLogin = async (email: string) => {
    setIsLoading(true)
    try {
      const { success, expired } = await loginWithRememberedUser(email)

      if (success) {
        const user = rememberedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

        toast({
          title: "Welcome back!",
          description: `You've been logged in as ${user?.name || email}`,
        })

        router.push("/dashboard")
      } else if (expired) {
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Your saved login has expired. Please log in again.",
        })

        // Update the UI to remove the expired user
        setRememberedUsers((prev) => prev.filter((user) => user.email.toLowerCase() !== email.toLowerCase()))
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Your saved login is no longer valid. Please log in with your credentials.",
        })

        // Update the UI to remove the invalid user
        setRememberedUsers((prev) => prev.filter((user) => user.email.toLowerCase() !== email.toLowerCase()))
      }
    } catch (error) {
      console.error("Error during quick login:", error)
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An error occurred. Please try logging in with your credentials.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForget = async (email: string) => {
    try {
      await removeRememberedUser(email)

      // Update the local state
      setRememberedUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase()))

      toast({
        title: "User forgotten",
        description: "The saved login has been removed.",
      })
    } catch (error) {
      console.error("Error forgetting user:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove the saved login.",
      })
    }
  }

  if (isValidating) {
    return (
      <div className="mb-6 flex justify-center">
        <div className="animate-pulse h-12 w-12 rounded-full bg-gray-200"></div>
      </div>
    )
  }

  if (rememberedUsers.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">Quick Login</h3>
      <div className="flex justify-center gap-3">
        {rememberedUsers.map((user) => (
          <RememberedUserIcon
            key={user.email}
            user={user}
            onLogin={handleLogin}
            onForget={handleForget}
            disabled={isLoading}
          />
        ))}
      </div>
    </div>
  )
}
