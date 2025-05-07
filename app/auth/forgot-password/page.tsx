"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // In a real app, you would call your password reset API here
      // For demo purposes, we'll simulate a successful request
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check if the email exists in our "database"
      const storedEmail = localStorage.getItem("userEmail")

      if (email === storedEmail) {
        setIsSubmitted(true)

        // In a real app, this would send an email with a reset link
        // For demo purposes, we'll just show a success message
      } else {
        // Even if the email doesn't exist, we show the same message for security
        setIsSubmitted(true)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem processing your request. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetDemo = () => {
    // For demo purposes, we'll reset the password to a known value
    localStorage.setItem("userPassword", "newpassword123")

    toast({
      title: "Password Reset",
      description: "Your password has been reset to: newpassword123",
    })

    router.push("/auth/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
        </CardHeader>

        {isSubmitted ? (
          <>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  If an account exists with the email <strong>{email}</strong>, you will receive password reset
                  instructions.
                </AlertDescription>
              </Alert>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-500 mb-4">
                  For demo purposes, you can use the button below to reset your password immediately:
                </p>
                <Button onClick={handleResetDemo} className="w-full">
                  Reset Password (Demo)
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/auth/login")}>
                Back to Login
              </Button>
            </CardFooter>
          </>
        ) : (
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
