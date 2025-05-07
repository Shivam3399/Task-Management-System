"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import DashboardHeader from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"
import { getCurrentUser, findUserByEmail } from "@/utils/auth-service"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"

export default function AccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<{ id: string; name: string; email: string } | null>(null)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Get current user data
    const user = getCurrentUser()
    if (user) {
      setUserData({
        id: user.id,
        name: user.name,
        email: user.email,
      })
    }
  }, [])

  const handleChangePassword = () => {
    setIsPasswordDialogOpen(true)
    // Reset form state
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
  }

  const validatePasswordStrength = (password: string) => {
    const minLength = 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const startsWithUppercase = /^[A-Z]/.test(password)

    const isValid =
      password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && startsWithUppercase

    return {
      isValid,
      feedback: {
        hasMinLength: password.length >= minLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar,
        startsWithUppercase,
      },
    }
  }

  const handlePasswordSubmit = async () => {
    // Reset previous errors
    setPasswordError("")

    // Validate all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required")
      return
    }

    // Validate new password and confirm password match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match")
      return
    }

    // Validate new password is different from current password
    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from current password")
      return
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      if (!passwordValidation.feedback.hasMinLength) {
        setPasswordError("Password must be at least 8 characters long")
      } else if (!passwordValidation.feedback.startsWithUppercase) {
        setPasswordError("Password must start with an uppercase letter")
      } else if (!passwordValidation.feedback.hasUppercase) {
        setPasswordError("Password must include at least one uppercase letter")
      } else if (!passwordValidation.feedback.hasLowercase) {
        setPasswordError("Password must include at least one lowercase letter")
      } else if (!passwordValidation.feedback.hasNumber) {
        setPasswordError("Password must include at least one number")
      } else if (!passwordValidation.feedback.hasSpecialChar) {
        setPasswordError("Password must include at least one special character")
      }
      return
    }

    try {
      // Verify current password is correct
      if (userData?.email) {
        const user = await findUserByEmail(userData.email)

        if (!user || user.password !== currentPassword) {
          setPasswordError("Current password is incorrect")
          return
        }

        // In a real app, you would call an API to update the password
        // For this demo, we'll update the mock database
        user.password = newPassword

        // Update localStorage for demo purposes
        localStorage.setItem("userPassword", newPassword)

        toast({
          title: "Password Changed",
          description: "Your password has been successfully updated",
        })

        // Reset form and close dialog
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordError("")
        setIsPasswordDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating password:", error)
      setPasswordError("An error occurred while updating your password")
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Account Overview</h1>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>View and manage your account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Name</h3>
                        <p className="mt-1">{userData?.name || "Loading..."}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="mt-1">{userData?.email || "Loading..."}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Role</h3>
                        <p className="mt-1">Administrator</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                        <p className="mt-1">January 15, 2023</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push("/dashboard")}>
                      Back to Dashboard
                    </Button>
                    <Button onClick={() => router.push("/profile")}>Edit Profile</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="subscription">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Details</CardTitle>
                    <CardDescription>Manage your subscription plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">Current Plan: Pro</h3>
                            <p className="text-sm text-gray-500">Billed annually</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">$99/year</p>
                            <p className="text-sm text-gray-500">Renews on Jan 15, 2024</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Upgrade Plan
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Password</h3>
                      <p className="text-sm text-gray-500 mb-4">Last changed 3 months ago</p>
                      <Button variant="outline" size="sm" onClick={handleChangePassword}>
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and a new password to update your credentials
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="sr-only">{showCurrentPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="sr-only">{showNewPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
                <PasswordStrengthMeter password={newPassword} className="mt-2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false)
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                  setPasswordError("")
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handlePasswordSubmit}>
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
