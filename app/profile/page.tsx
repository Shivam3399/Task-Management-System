"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardHeader from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"
import { getCurrentUser } from "@/utils/auth-service"
import { AvatarUpload } from "@/components/avatar-upload"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    // Get current user data
    const user = getCurrentUser()
    if (user) {
      setUserData({
        name: user.name,
        email: user.email,
      })

      // Try to get saved avatar from localStorage
      const savedAvatar = localStorage.getItem("userAvatar")
      if (savedAvatar) {
        setAvatarUrl(savedAvatar)
      }
    }
  }, [])

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl)

    // Save to localStorage
    if (newAvatarUrl) {
      localStorage.setItem("userAvatar", newAvatarUrl)
    } else {
      localStorage.removeItem("userAvatar")
    }
  }

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    })
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold mb-6">User Profile</h1>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal information and account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {userData && (
                    <AvatarUpload name={userData.name} currentAvatar={avatarUrl} onAvatarChange={handleAvatarChange} />
                  )}
                  <div className="space-y-2 text-center md:text-left">
                    <h2 className="text-xl font-semibold">{userData?.name || "Loading..."}</h2>
                    <p className="text-gray-500">{userData?.email || "Loading..."}</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
