"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import DashboardHeader from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"
import { deleteUser, removeRememberedUser } from "@/utils/auth-db"
import { getCurrentUser, logout } from "@/utils/auth-service"
import { useToast } from "@/components/ui/use-toast"
import * as IndexedDB from "@/utils/indexed-db"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Get current user
  const currentUser = getCurrentUser()
  const userEmail = currentUser?.email || ""

  const handleDeleteAccount = async () => {
    if (!currentUser || !userEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to identify current user. Please log in again.",
      })
      return
    }

    // Verify email confirmation
    if (confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Email Mismatch",
        description: "The email you entered doesn't match your account email.",
      })
      return
    }

    setIsDeleting(true)

    try {
      // Delete user from auth database
      await deleteUser(userEmail)

      // Remove from remembered users
      await removeRememberedUser(userEmail)

      // Clear all tokens associated with the user
      const tokenStore = "tokens"
      try {
        // Get all tokens and filter for this user's tokens
        const allTokens = await IndexedDB.getAllItems(tokenStore)
        for (const token of allTokens) {
          if (token.userId === currentUser.id) {
            await IndexedDB.deleteItem(tokenStore, token.token)
          }
        }
      } catch (err) {
        console.error("Error clearing tokens:", err)
      }

      // Also remove from mock database if it exists
      try {
        const mockDbKey = "user_database"
        const mockDb = localStorage.getItem(mockDbKey)
        if (mockDb) {
          const users = JSON.parse(mockDb)
          const updatedUsers = users.filter((u) => u.email.toLowerCase() !== userEmail.toLowerCase())
          localStorage.setItem(mockDbKey, JSON.stringify(updatedUsers))
        }
      } catch (err) {
        console.error("Error updating mock database:", err)
      }

      // Clear all authentication data
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("remember_token")
      localStorage.removeItem("user_session")
      localStorage.removeItem("current_token")

      // Perform complete logout
      await logout()

      // Clear all localStorage as a final measure
      localStorage.clear()

      // Force IndexedDB operations to complete before redirecting
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      })

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting your account. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-500">Receive notifications in the browser</p>
                  </div>
                  <Switch id="push-notifications" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Delete My Account</CardTitle>
                <CardDescription>Permanently delete your account and all associated data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>
                          This action cannot be undone. This will permanently delete your account and remove all your
                          data from our servers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {!showConfirmation ? (
                  <Button variant="destructive" onClick={() => setShowConfirmation(true)}>
                    I Want To Delete My Account
                  </Button>
                ) : (
                  <div className="space-y-4 border border-red-200 rounded-md p-4">
                    <h3 className="font-medium">Confirm Account Deletion</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To confirm deletion, please enter your email address: <strong>{userEmail}</strong>
                    </p>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowConfirmation(false)
                          setConfirmEmail("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
