"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/utils/auth-service"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      console.log("AuthGuard: Checking authentication status")

      // First check localStorage for faster response
      const isAuth = localStorage.getItem("isAuthenticated") === "true"
      const sessionData = localStorage.getItem("user_session")

      console.log("AuthGuard: Local auth status:", isAuth)
      console.log("AuthGuard: Session data exists:", !!sessionData)

      if (isAuth && sessionData) {
        console.log("AuthGuard: User is authenticated via localStorage")
        setIsChecking(false)
        return
      }

      // Fall back to the more thorough check
      if (!isAuthenticated()) {
        console.log("AuthGuard: User is not authenticated, redirecting to login")
        router.push("/auth/login")
      } else {
        console.log("AuthGuard: User is authenticated via isAuthenticated()")
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
