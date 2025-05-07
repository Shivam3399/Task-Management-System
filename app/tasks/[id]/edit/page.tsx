"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DashboardHeader from "@/components/dashboard-header"
import { getTasks, updateTask, type Task } from "@/utils/task-storage"
import { AuthGuard } from "@/components/auth-guard"
import { getAllUsers } from "@/utils/auth-db"
import { checkDatabaseStatus } from "@/utils/indexed-db"

export default function EditTaskPage() {
  const [task, setTask] = useState<Task | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("low")
  const [status, setStatus] = useState<"todo" | "in-progress" | "completed">("todo")
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [assignedTo, setAssignedTo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTask, setIsLoadingTask] = useState(true)
  const [registeredUsers, setRegisteredUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

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

  useEffect(() => {
    const taskId = params.id as string
    if (!taskId) return

    // Load task data
    const tasks = getTasks()
    const foundTask = tasks.find((t) => t.id === taskId)

    if (foundTask) {
      setTask(foundTask)
      setTitle(foundTask.title)
      setDescription(foundTask.description)
      setPriority(foundTask.priority)
      setStatus(foundTask.status)
      setDueDate(new Date(foundTask.dueDate))
      setAssignedTo(foundTask.assignedTo)
    } else {
      toast({
        variant: "destructive",
        title: "Task not found",
        description: "The task you're trying to edit could not be found",
      })
      router.push("/dashboard")
    }

    setIsLoadingTask(false)
  }, [params.id, router, toast])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title || !priority || !dueDate || !assignedTo) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields",
      })
      return
    }

    setIsLoading(true)

    try {
      if (task) {
        // Update the task
        updateTask(task.id, {
          title,
          description,
          status,
          priority,
          dueDate: dueDate!.toISOString().split("T")[0],
          assignedTo,
        })

        toast({
          title: "Task updated",
          description: "Your task has been updated successfully",
        })

        // Redirect to the dashboard
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: error.message || "There was a problem updating your task",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingTask) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4">Loading task...</p>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Edit Task</CardTitle>
                <CardDescription>Update task details</CardDescription>
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
                      <Select value={priority} onValueChange={(value) => setPriority(value as any)} required>
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
                      <Select value={status} onValueChange={(value) => setStatus(value as any)} required>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal" id="dueDate">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Assign To</Label>
                      <Select value={assignedTo} onValueChange={setAssignedTo} required disabled={isLoadingUsers}>
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

                      {/* Debug information */}
                      {dbStatus && (
                        <div className="mt-2 text-xs text-muted-foreground border border-gray-200 p-2 rounded">
                          <p>Database exists: {dbStatus.exists ? "Yes" : "No"}</p>
                          <p>Stores: {dbStatus.stores.join(", ") || "None"}</p>
                          <p>User count: {dbStatus.userCount}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Task"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
