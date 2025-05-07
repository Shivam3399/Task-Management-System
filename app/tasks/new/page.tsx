"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DashboardHeader from "@/components/dashboard-header"
import { addTask } from "@/utils/task-storage"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAllUsers } from "@/utils/auth-db"
import { checkDatabaseStatus } from "@/utils/indexed-db"

export default function NewTaskPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("")
  const [status, setStatus] = useState("")
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [assignedTo, setAssignedTo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [registeredUsers, setRegisteredUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  // Fetch registered users from IndexedDB
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true)
      try {
        // Check database status
        const status = await checkDatabaseStatus()
        setDbStatus(status)
        console.log("Database status:", status)

        // Get users from IndexedDB
        const users = await getAllUsers()
        console.log("Retrieved users from database:", users)

        if (users && users.length > 0) {
          // Map users to the format needed for the dropdown
          const formattedUsers = users.map((user) => ({
            id: user.email, // Use email as ID since it's unique
            name: user.name,
            email: user.email,
          }))

          // Add current user if not already in the list
          const currentUserEmail = localStorage.getItem("userEmail")
          const currentUserName = localStorage.getItem("userName") || "You"

          if (
            currentUserEmail &&
            !formattedUsers.some((u) => u.email.toLowerCase() === currentUserEmail.toLowerCase())
          ) {
            formattedUsers.push({
              id: currentUserEmail,
              name: `${currentUserName} (You)`,
              email: currentUserEmail,
            })
          }

          setRegisteredUsers(formattedUsers)
        } else {
          // If no users found, just add the current user
          const currentUserEmail = localStorage.getItem("userEmail")
          const currentUserName = localStorage.getItem("userName") || "You"

          if (currentUserEmail) {
            setRegisteredUsers([
              {
                id: currentUserEmail,
                name: `${currentUserName} (You)`,
                email: currentUserEmail,
              },
            ])
          } else {
            // No users at all, show empty state
            setRegisteredUsers([])
          }
        }
      } catch (error) {
        console.error("Error fetching registered users:", error)
        // If error, just add the current user
        const currentUserEmail = localStorage.getItem("userEmail")
        const currentUserName = localStorage.getItem("userName") || "You"

        if (currentUserEmail) {
          setRegisteredUsers([
            {
              id: currentUserEmail,
              name: `${currentUserName} (You)`,
              email: currentUserEmail,
            },
          ])
        } else {
          setRegisteredUsers([])
        }
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError(null)

    if (!title || !priority || !dueDate || !assignedTo || !status) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields",
      })
      return
    }

    // Validate that the assigned user is registered
    const isRegisteredUser = registeredUsers.some((user) => user.id === assignedTo)
    if (!isRegisteredUser) {
      setValidationError("Tasks can only be assigned to registered team members")
      return
    }

    setIsLoading(true)

    try {
      // Get current user ID - use email as the unique identifier
      const currentUserId = localStorage.getItem("userEmail") || "currentUser"
      const userName = localStorage.getItem("userName") || "User"

      console.log(`Creating task as user: ${currentUserId} (${userName})`)
      console.log(`Assigning task to: ${assignedTo}`)

      // Add the new task to storage
      addTask({
        title,
        description,
        status: status as "todo" | "in-progress" | "completed",
        priority: priority as "low" | "medium" | "high" | "critical",
        dueDate: dueDate!.toISOString().split("T")[0],
        assignedTo,
        createdBy: currentUserId,
      })

      toast({
        title: "Task created",
        description: "Your task has been created successfully",
      })

      // Redirect to the "Created by Me" tab
      // Use replace instead of push to avoid adding to history stack
      router.replace("/dashboard?view=created")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create task",
        description: error.message || "There was a problem creating your task",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>Add a new task to your project</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Task description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority} required>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus} required>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" id="dueDate">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => {
                            setDueDate(date)
                            setIsCalendarOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign To Registered User</Label>
                    <Select
                      value={assignedTo}
                      onValueChange={(value) => {
                        setAssignedTo(value)
                        setValidationError(null)
                      }}
                      required
                      disabled={isLoadingUsers}
                    >
                      <SelectTrigger id="assignedTo">
                        <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select user"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>
                            Loading users...
                          </SelectItem>
                        ) : registeredUsers.length === 0 ? (
                          <SelectItem value="no-users" disabled>
                            No registered users found
                          </SelectItem>
                        ) : (
                          registeredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {registeredUsers.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {registeredUsers.length === 1
                          ? "Only you are available for task assignment"
                          : `Available users: ${registeredUsers.map((user) => user.name.split(" (")[0]).join(", ")}`}
                      </p>
                    )}

                    {/* Debug information - hidden but functionality preserved */}
                    {dbStatus && (
                      <div className="hidden">
                        <p>Database exists: {dbStatus.exists ? "Yes" : "No"}</p>
                        <p>Stores: {dbStatus.stores.join(", ") || "None"}</p>
                        <p>User count: {dbStatus.userCount}</p>
                      </div>
                    )}
                  </div>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Task"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
