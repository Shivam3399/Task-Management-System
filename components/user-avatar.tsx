"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { RememberedUser } from "@/utils/auth-types"

interface UserAvatarProps {
  user: RememberedUser
  onLogin: (email: string) => void
  onForget: (email: string) => void
  disabled?: boolean
}

export function UserAvatar({ user, onLogin, onForget, disabled = false }: UserAvatarProps) {
  const [showForget, setShowForget] = useState(false)

  // Generate a color based on the user's email (for visual distinction)
  const getColorFromEmail = (email: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-teal-500",
    ]

    // Simple hash function to get a consistent color for each email
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  const bgColor = getColorFromEmail(user.email)

  return (
    <TooltipProvider>
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowForget(true)}
        onMouseLeave={() => setShowForget(false)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onLogin(user.email)}
              className={`w-12 h-12 rounded-full ${bgColor} text-white font-semibold text-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-110 ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              aria-label={`Login as ${user.name}`}
              disabled={disabled}
            >
              {user.initials}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Login as {user.name}</p>
          </TooltipContent>
        </Tooltip>

        {showForget && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onForget(user.email)
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 focus:outline-none"
            aria-label={`Forget ${user.name}`}
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </TooltipProvider>
  )
}
