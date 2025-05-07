"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { checkDatabaseStatus } from "@/utils/indexed-db"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Check database status on load
  useEffect(() => {
    const checkDb = async () => {
      const status = await checkDatabaseStatus()
      setDbStatus(status)
      console.log("Database status on login page:", status)
    }
    checkDb()
  }, [])

  // Load remembered users on mount
  useEffect(() => {
    try {
      const rememberedUsersJson = localStorage.getItem("remembered_users")
      if (rememberedUsersJson) {
        const rememberedUsers = JSON.parse(rememberedUsersJson)
        console.log(`Found ${rememberedUsers.length} remembered users:`, rememberedUsers)

        // If there's only one remembered user, auto-fill the email
        if (rememberedUsers.length === 1) {
          setEmail(rememberedUsers[0].email)
          setRememberMe(true)
        }
      } else {
        console.log("No remembered users found in localStorage")
      }
    } catch (error) {
      console.error("Error loading remembered users:", error)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Import auth service dynamically to avoid SSR issues
      const { findUserByEmail } = await import("@/utils/auth-db")

      // Log the attempt
      console.log(`Attempting to login with email: ${email}`)

      // Find the user
      const user = await findUserByEmail(email)
      console.log("Login lookup result:", user ? "User found" : "User not found")

      if (!user) {
        throw new Error("Invalid email or password")
      }

      // Check password
      if (user.password !== password) {
        throw new Error("Invalid email or password")
      }

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
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userName", user.name)
      localStorage.setItem("userEmail", user.email)

      // Handle remember me
      if (rememberMe) {
        try {
          console.log("Remember me is checked, saving user credentials")

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
          const existingUsersJson = localStorage.getItem("remembered_users")
          let rememberedUsers = []

          if (existingUsersJson) {
            try {
              rememberedUsers = JSON.parse(existingUsersJson)
            } catch (e) {
              console.error("Error parsing remembered users:", e)
              rememberedUsers = []
            }
          }

          console.log("Existing remembered users:", rememberedUsers)

          // Check if user already exists in remembered users
          const existingIndex = rememberedUsers.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase())

          if (existingIndex >= 0) {
            // Update existing user
            console.log("Updating existing remembered user")
            rememberedUsers[existingIndex] = rememberedUser
          } else {
            // Add the new user to the list
            console.log("Adding new remembered user")
            rememberedUsers.push(rememberedUser)
          }

          // Save the updated list
          const rememberedUsersString = JSON.stringify(rememberedUsers)
          console.log("Saving remembered users:", rememberedUsersString)
          localStorage.setItem("remembered_users", rememberedUsersString)
          localStorage.setItem("current_token", token)

          console.log("Remember me token created:", rememberedUser)

          // Verify the save worked
          const savedUsersJson = localStorage.getItem("remembered_users")
          console.log("Verified saved remembered users:", savedUsersJson)
        } catch (error) {
          console.error("Error setting up remember me:", error)
        }
      } else {
        console.log("Remember me is not checked, skipping credential save")
      }

      // Reset failed login attempts
      const { resetFailedLoginAttempts } = await import("@/utils/auth-db")
      await resetFailedLoginAttempts(email)

      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)

      // Record failed login attempt
      try {
        const { recordFailedLoginAttempt, isAccountLocked } = await import("@/utils/auth-db")

        // Check if account is locked
        const { locked, remainingTime } = await isAccountLocked(email)

        if (locked) {
          toast({
            variant: "destructive",
            title: "Account locked",
            description: `Too many failed attempts. Try again in ${Math.ceil(remainingTime / 60)} minutes.`,
          })
        } else {
          // Record failed attempt
          const { isLocked, lockoutTime } = await recordFailedLoginAttempt(email)

          if (isLocked) {
            toast({
              variant: "destructive",
              title: "Account locked",
              description: `Too many failed attempts. Try again in ${Math.ceil(lockoutTime / 60)} minutes.`,
            })
          } else {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: error.message || "Invalid email or password",
            })
          }
        }
      } catch (recordError) {
        console.error("Error recording failed login:", recordError)
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid email or password",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => {
                  console.log("Remember me checkbox changed:", checked)
                  setRememberMe(checked === true)
                }}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                onClick={() => {
                  console.log("Remember me label clicked")
                  setRememberMe(!rememberMe)
                }}
              >
                Remember me for quick login
              </label>
            </div>

            {/* Debug information - hidden but functionality preserved */}
            {dbStatus && (
              <div className="hidden">
                <p>Database exists: {dbStatus.exists ? "Yes" : "No"}</p>
                <p>Stores: {dbStatus.stores.join(", ") || "None"}</p>
                <p>User count: {dbStatus.userCount}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
