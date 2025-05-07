"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Trash,
  Search,
  Filter,
  PlusCircle,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { deleteTask, getTasks, type Task } from "@/utils/task-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
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

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
}

const statusIcons = {
  todo: <Clock className="h-4 w-4" />,
  "in-progress": <AlertCircle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
}

const statusClasses = {
  todo: "text-gray-500",
  "in-progress": "text-blue-500",
  completed: "text-green-500",
}

interface TaskListProps {
  tasks: Task[]
  onTasksChange?: () => void
}

export default function TaskList({ tasks, onTasksChange }: TaskListProps) {
  // Add state to store all tasks from localStorage
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load all tasks from localStorage on component mount
  useEffect(() => {
    try {
      const loadedTasks = getTasks()
      console.log("Directly loaded tasks from localStorage:", loadedTasks)
      setAllTasks(loadedTasks)
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add debugging logs
  console.log("TaskList component received tasks prop:", tasks)
  console.log("TaskList tasks prop length:", tasks?.length || 0)
  console.log("All tasks from localStorage:", allTasks)

  const [sortField, setSortField] = useState("dueDate")
  const [sortDirection, setSortDirection] = useState("asc")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Get the current user's ID from localStorage
  const getCurrentUserId = () => {
    if (typeof window !== "undefined") {
      // Try to get the user email from localStorage
      const userEmail = localStorage.getItem("userEmail")
      if (userEmail) return userEmail

      // For demo purposes, we'll use a consistent ID that matches our sample data
      return "currentUser"
    }
    return "currentUser"
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Determine which tasks to use - either from props or from localStorage
  const tasksToUse = tasks?.length > 0 ? tasks : allTasks
  console.log("Tasks to use for display:", tasksToUse)

  // Apply sorting and filtering
  const currentUserId = getCurrentUserId()
  console.log("Current user ID for filtering:", currentUserId)

  const filteredTasks = tasksToUse.filter((task) => {
    // Text search
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Priority filter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    // Status filter
    const matchesStatus = statusFilter === "all" || task.status === statusFilter

    return matchesSearch && matchesPriority && matchesStatus
  })

  console.log("Filtered tasks:", filteredTasks)
  console.log("Filtered tasks length:", filteredTasks.length)

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortField === "dueDate") {
      const dateA = new Date(a.dueDate)
      const dateB = new Date(b.dueDate)
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    } else if (sortField === "priority") {
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 }
      return sortDirection === "asc"
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority]
    } else {
      const valueA = a[sortField]?.toLowerCase() || ""
      const valueB = b[sortField]?.toLowerCase() || ""
      return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
    }
  })

  const handleView = (taskId) => {
    router.push(`/tasks/${taskId}`)
  }

  const handleEdit = (taskId) => {
    router.push(`/tasks/${taskId}/edit`)
  }

  const handleCreateTask = () => {
    router.push("/tasks/new")
  }

  const handleDeleteClick = (taskId) => {
    setTaskToDelete(taskId)
  }

  const confirmDelete = () => {
    if (taskToDelete) {
      // Delete the task from storage
      if (deleteTask(taskToDelete)) {
        toast({
          title: "Task deleted",
          description: "The task has been successfully deleted",
        })
        // Call the callback to refresh tasks instead of refreshing the page
        if (onTasksChange) {
          onTasksChange()
        }
        // Also refresh our local state
        setAllTasks(getTasks())
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete the task",
        })
      }
      setTaskToDelete(null)
    }
  }

  const cancelDelete = () => {
    setTaskToDelete(null)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Check if date is overdue
  const isOverdue = (dateString) => {
    const today = new Date()
    const dueDate = new Date(dateString)
    return dueDate < today
  }

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle>Tasks ({tasksToUse.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Priority</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("title")} className="flex items-center gap-1">
                      Title
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("priority")} className="flex items-center gap-1">
                      Priority
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("dueDate")} className="flex items-center gap-1">
                      Due Date
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>
                          No tasks found.{" "}
                          {tasksToUse.length > 0
                            ? "Try adjusting your search or filters."
                            : "Create your first task to get started."}
                        </p>
                        <p className="text-sm mt-1">
                          {tasksToUse.length > 0
                            ? `Total tasks available: ${tasksToUse.length}`
                            : "No tasks available yet."}
                        </p>
                        <Button onClick={handleCreateTask} variant="outline" className="mt-4">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create New Task
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTasks.map((task) => (
                    <TableRow key={task.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className={`flex items-center gap-1 ${statusClasses[task.status]}`}>
                          {statusIcons[task.status]}
                          <span className="text-xs capitalize">{task.status.replace("-", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{task.description}</div>
                        <div className="text-xs mt-1">{/* Assignment labels removed */}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${priorityColors[task.priority]} px-2 py-1 text-xs`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`text-sm ${isOverdue(task.dueDate) && task.status !== "completed" ? "text-red-500 font-medium" : ""}`}
                        >
                          {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate) && task.status !== "completed" && (
                            <div className="text-xs text-red-500">Overdue</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => handleView(task.id)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(task.id)} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(task.id)}
                              className="cursor-pointer text-red-500 focus:text-red-500"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      {/* Delete Confirmation Dialog */}
      {taskToDelete && (
        <AlertDialog open={true} onOpenChange={() => setTaskToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  )
}
