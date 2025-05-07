"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createUser, validatePasswordStrength } from "@/utils/auth-db"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { checkDatabaseStatus } from "@/utils/indexed-db"
import { Checkbox } from "@/components/ui/checkbox"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
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
  const [dbStatus, setDbStatus] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(validatePasswordStrength(newPassword))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Check database status before registration
      const status = await checkDatabaseStatus()
      setDbStatus(status)
      console.log("Database status before registration:", status)

      // Validate password strength
      if (!passwordStrength.isValid) {
        toast({
          variant: "destructive",
          title: "Password does not meet requirements",
          description: "Please ensure your password meets all the requirements.",
        })
        setIsLoading(false)
        return
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Passwords do not match",
          description: "Please ensure both passwords match.",
        })
        setIsLoading(false)
        return
      }

      // Create user
      const user = await createUser({
        name,
        email,
        password,
      })

      console.log("User registered successfully:", user)

      // Check database status after registration
      const afterStatus = await checkDatabaseStatus()
      console.log("Database status after registration:", afterStatus)

      // Create session
      const session = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
      }

      // Store session in localStorage
      localStorage.setItem("user_session", JSON.stringify(session))

      // Set authentication data
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userName", user.name)
      localStorage.setItem("userEmail", user.email)

      // Handle remember me functionality
      if (rememberMe) {
        try {
          // Generate a token for the user
          const token = Date.now().toString(36) + Math.random().toString(36).substring(2)

          // Create a remembered user object
          const rememberedUser = {
            token,
            name: user.name,
            email: user.email,
            initials: user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            lastLogin: new Date().toISOString(),
          }

          // Get existing remembered users
          const existingUsers = localStorage.getItem("remembered_users")
          const rememberedUsers = existingUsers ? JSON.parse(existingUsers) : []

          // Add the new user to the list
          rememberedUsers.push(rememberedUser)

          // Save the updated list
          localStorage.setItem("remembered_users", JSON.stringify(rememberedUsers))
          localStorage.setItem("current_token", token)

          console.log("Remember me token created for new user:", rememberedUser)
        } catch (error) {
          console.error("Error setting up remember me:", error)
        }
      }

      toast({
        title: "Registration successful",
        description: "You have been registered and logged in.",
      })

      // Add a small delay to ensure localStorage is updated
      setTimeout(() => {
        // Redirect to dashboard
        router.push("/dashboard")
      }, 100)
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "There was a problem with your registration.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              <PasswordStrengthMeter strength={passwordStrength} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me for quick login
              </label>
            </div>

            {/* Debug information */}
            {dbStatus && (
              <div className="mt-2 text-xs text-muted-foreground border border-gray-200 p-2 rounded">
                <p>Database exists: {dbStatus.exists ? "Yes" : "No"}</p>
                <p>Stores: {dbStatus.stores.join(", ") || "None"}</p>
                <p>User count: {dbStatus.userCount}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
