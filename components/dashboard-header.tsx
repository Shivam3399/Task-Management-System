"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckCircle,
  LogOut,
  Menu,
  PlusCircle,
  Settings,
  User,
  User2,
  X,
  Home,
  Briefcase,
  Users,
  Search,
  ListTodo,
  MoonStar,
  Sun,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { logout, getCurrentUser } from "@/utils/auth-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { TaskNotification } from "@/components/task-notification"
// Remove the UserSwitcher import

export default function DashboardHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Initialize theme on component mount
  useEffect(() => {
    // Check if dark mode is enabled in localStorage
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    // Set initial state based on localStorage or system preference
    const initialDarkMode = savedTheme === "dark" || (!savedTheme && prefersDark)
    setIsDarkMode(initialDarkMode)

    // Apply the theme to the document
    if (initialDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    console.log("Theme initialized:", initialDarkMode ? "dark" : "light")
  }, [])

  useEffect(() => {
    // Get user data
    const user = getCurrentUser()
    if (user) {
      setUserName(user.name)

      // Store current user ID for notifications
      localStorage.setItem("currentUserId", user.id || "currentUser")

      // Also store username for notifications
      localStorage.setItem("userName", user.name || "User")
    }

    // Try to get saved avatar from localStorage
    const savedAvatar = localStorage.getItem("userAvatar")
    if (savedAvatar) {
      setAvatarUrl(savedAvatar)
    }

    // Add scroll event listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Function to toggle theme
  const toggleTheme = () => {
    try {
      const newDarkMode = !isDarkMode
      console.log("Toggling theme to:", newDarkMode ? "dark" : "light")

      // Update state
      setIsDarkMode(newDarkMode)

      // Update localStorage
      localStorage.setItem("theme", newDarkMode ? "dark" : "light")

      // Update document class
      if (newDarkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      // Show toast for feedback
      toast({
        title: `${newDarkMode ? "Dark" : "Light"} mode enabled`,
        duration: 1500,
      })
    } catch (error) {
      console.error("Error toggling theme:", error)
      toast({
        variant: "destructive",
        title: "Theme Error",
        description: "Could not change theme. Please try again.",
      })
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const handleLogout = async () => {
    try {
      // Logout but preserve remembered users
      await logout()

      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        duration: 2000, // 2 seconds instead of default 5 seconds
      })

      // Force redirect to login page
      router.push("/auth/login")
    } catch (error) {
      console.error("Error during logout:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem logging out. Please try again.",
      })
    }
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleAccountClick = () => {
    router.push("/account")
  }

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${isScrolled ? "glass-effect shadow-sm" : "bg-background"}`}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2 px-2 md:px-4">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent hidden sm:inline-block">
              TaskMaster
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
          </Link>

          {/* Changed from dropdown to direct link */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => (window.location.href = "/tasks")}
          >
            <ListTodo className="h-4 w-4" />
            <span>Tasks</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Team</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 animate-slide-in">
              <DropdownMenuItem onClick={() => router.push("/team")}>
                <User2 className="mr-2 h-4 w-4" />
                All Team Members
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/team/roles")}>
                <Settings className="mr-2 h-4 w-4" />
                Team Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/team/assignments")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Task Assignments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Search bar - visible on desktop */}
        <div className="hidden md:flex items-center gap-2 max-w-xs w-full mx-4">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-9 h-9 bg-secondary/50 border-0 focus-visible:ring-1" />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-secondary"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
        </div>

        {/* User actions */}
        <div className="flex items-center gap-2">
          <TaskNotification />
          {/* Removed UserSwitcher component */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 cursor-pointer">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src={avatarUrl || ""} alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-slide-in">
              <div className="px-3 py-2 border-b">
                <p className="font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <DropdownMenuItem
                onClick={() => router.push("/account")}
                className="cursor-pointer font-medium flex items-center gap-2 py-2 px-3"
              >
                <User2 className="h-4 w-4" />
                My Account
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={handleProfileClick}
                className="cursor-pointer flex items-center gap-2 py-2 px-3"
              >
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSettingsClick}
                className="cursor-pointer flex items-center gap-2 py-2 px-3"
              >
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer flex items-center gap-2 py-2 px-3 text-red-500"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-4 py-3 space-y-3 bg-background border-b">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input placeholder="Search tasks..." className="pl-9" />
            </div>

            <nav className="flex flex-col space-y-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => router.push("/tasks")}>
                <ListTodo className="h-4 w-4 mr-2" />
                Tasks
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => router.push("/team")}>
                <Users className="h-4 w-4 mr-2" />
                Team
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/tasks/new")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Task
              </Button>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
