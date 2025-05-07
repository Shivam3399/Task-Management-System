"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, Edit, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DashboardHeader from "@/components/dashboard-header"
import { getTasks, deleteTask, type Task } from "@/utils/task-storage"
import { AuthGuard } from "@/components/auth-guard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function TaskDetailPage() {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  // Mock team members for demonstration
  const teamMembers = [
    { id: "user1", name: "John Doe" },
    { id: "user2", name: "Jane Smith" },
    { id: "user3", name: "Bob Johnson" },
    { id: "currentUser", name: "You" },
  ]

  useEffect(() => {
    const taskId = params.id as string
    if (!taskId) return

    // Load task data
    const tasks = getTasks()
    const foundTask = tasks.find((t) => t.id === taskId)

    if (foundTask) {
      setTask(foundTask)
    } else {
      toast({
        variant: "destructive",
        title: "Task not found",
        description: "The task you're trying to view could not be found",
      })
      router.push("/dashboard")
    }

    setIsLoading(false)
  }, [params.id, router, toast])

  const handleEdit = () => {
    if (task) {
      router.push(`/tasks/${task.id}/edit`)
    }
  }

  const handleDelete = () => {
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (task) {
      deleteTask(task.id)
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted",
      })
      router.push("/dashboard")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <Clock className="h-5 w-5 text-gray-500" />
      case "in-progress":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-500"
      case "medium":
        return "bg-blue-500"
      case "high":
        return "bg-orange-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getAssigneeName = (id: string) => {
    const member = teamMembers.find((m) => m.id === id)
    return member ? member.name : "Unknown"
  }

  const getAssignerName = (id: string) => {
    // This would ideally come from your user database
    const assigners = [
      { id: "admin1", name: "Admin User" },
      { id: "manager1", name: "Project Manager" },
      { id: "lead1", name: "Team Lead" },
      { id: "currentUser", name: "You" },
      ...teamMembers,
    ]

    const assigner = assigners.find((a) => a.id === id)
    return assigner ? assigner.name : "Unknown"
  }

  const getAssignerInitials = (id: string) => {
    const name = getAssignerName(id)
    return name === "Unknown"
      ? "?"
      : name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (isLoading) {
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

  if (!task) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p>Task not found</p>
                <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
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
          <div className="mx-auto max-w-3xl">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center">
                      {getStatusIcon(task.status)}
                      <span className="ml-1 text-sm capitalize">{task.status.replace("-", " ")}</span>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-500" onClick={handleDelete}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 whitespace-pre-wrap">{task.description || "No description provided."}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned By</h3>
                  <p className="mt-1 flex items-center gap-2">
                    {task.assignedBy ? (
                      <>
                        <span className="inline-block h-6 w-6 rounded-full bg-primary/10 text-xs flex items-center justify-center text-primary font-medium">
                          {getAssignerInitials(task.assignedBy)}
                        </span>
                        {getAssignerName(task.assignedBy)}
                      </>
                    ) : (
                      "System"
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <p className="mt-1">{formatDate(task.dueDate)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  )
}
