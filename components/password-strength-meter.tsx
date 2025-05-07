"use client"

import { useState, useEffect } from "react"
import { validatePasswordStrength } from "@/utils/auth-db"
import { CheckCircle2, XCircle } from "lucide-react"

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

export function PasswordStrengthMeter({ password, className = "" }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState({
    score: 0,
    feedback: {
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
      startsWithUppercase: false,
    },
  })

  useEffect(() => {
    if (password) {
      const result = validatePasswordStrength(password)
      setStrength(result)
    } else {
      setStrength({
        score: 0,
        feedback: {
          hasMinLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumber: false,
          hasSpecialChar: false,
          startsWithUppercase: false,
        },
      })
    }
  }, [password])

  const getStrengthLabel = (score: number) => {
    if (score === 0) return "Very Weak"
    if (score === 1) return "Weak"
    if (score === 2) return "Fair"
    if (score === 3) return "Good"
    return "Strong"
  }

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-red-500"
    if (score === 1) return "bg-orange-500"
    if (score === 2) return "bg-yellow-500"
    if (score === 3) return "bg-blue-500"
    return "bg-green-500"
  }

  return (
    <div className={`hidden ${className}`}>
      {/* Password strength checks still run, but UI is hidden */}
      {password && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getStrengthColor(strength.score)}`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium">{getStrengthLabel(strength.score)}</span>
          </div>

          <div className="text-xs space-y-1">
            <p className="font-medium">Password requirements:</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-1">
                {strength.feedback.hasMinLength ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>At least 8 characters</span>
              </li>
              <li className="flex items-center gap-1">
                {strength.feedback.startsWithUppercase ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Start with uppercase letter</span>
              </li>
              <li className="flex items-center gap-1">
                {strength.feedback.hasUppercase ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Uppercase letter (A-Z)</span>
              </li>
              <li className="flex items-center gap-1">
                {strength.feedback.hasLowercase ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Lowercase letter (a-z)</span>
              </li>
              <li className="flex items-center gap-1">
                {strength.feedback.hasNumber ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Number (0-9)</span>
              </li>
              <li className="flex items-center gap-1">
                {strength.feedback.hasSpecialChar ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Special character (!@#$%^&*)</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
