"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  ListTodo,
  PlusCircle,
  Search,
  Trash2,
  CalendarIcon,
  ArrowUpDown,
  MoreHorizontal,
  Star,
  StarOff,
  User2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import DashboardHeader from "@/components/dashboard-header"
import {
  getTasks,
  getTasksAssignedToMe,
  getTasksCreatedByMe,
  deleteTask,
  updateTask,
  type Task,
} from "@/utils/task-storage"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

// Team members for demonstration
const teamMembers = [
  { id: "user1", name: "John Doe" },
  { id: "user2", name: "Jane Smith" },
  { id: "user3", name: "Bob Johnson" },
  { id: "currentUser", name: "You" },
  { id: "ravi@example.com", name: "Ravi" },
  { id: "jane@example.com", name: "Jane" },
]

export default function TasksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // State
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [createdTasks, setCreatedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab")
    return tabParam || "all"
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("dueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [favoriteTaskIds, setFavoriteTaskIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const savedFavorites = localStorage.getItem("favorite_tasks")
      if (savedFavorites) {
        try {
          return JSON.parse(savedFavorites)
        } catch (error) {
          console.error("Error loading favorites:", error)
        }
      }
    }
    return []
  })

  // Load tasks
  const loadTasks = useCallback(() => {
    setIsLoading(true)
    try {
      setAllTasks(getTasks())
      setAssignedTasks(getTasksAssignedToMe())
      setCreatedTasks(getTasksCreatedByMe())
    } catch (error) {
      console.error("Error loading tasks:", error)
      toast({
        variant: "destructive",
        title: "Error loading tasks",
        description: "There was a problem loading your tasks. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Initial load
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Update URL when tab changes
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

  // Calculate derived values
  const completedTasks = useMemo(() => {
    return allTasks.filter((task) => task.status === "completed")
  }, [allTasks])

  const completionRate = useMemo(() => {
    return allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0
  }, [allTasks, completedTasks])

  // Apply all filters to get filtered tasks
  const filteredTasks = useMemo(() => {
    let filtered: Task[] = []

    // Select the base task list based on the active tab
    switch (activeTab) {
      case "assigned":
        filtered = [...assignedTasks]
        break
      case "created":
        filtered = [...createdTasks]
        break
      case "completed":
        filtered = [...completedTasks]
        break
      case "favorites":
        filtered = allTasks.filter((task) => favoriteTaskIds.includes(task.id))
        break
      default: // "all" tab
        filtered = [...allTasks]
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) => task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case "priority":
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        default:
          comparison = 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [
    activeTab,
    allTasks,
    assignedTasks,
    createdTasks,
    completedTasks,
    searchQuery,
    statusFilter,
    priorityFilter,
    sortBy,
    sortDirection,
    favoriteTaskIds,
  ])

  // Event handlers
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      router.push(`/tasks?tab=${value}`, { scroll: false })
    },
    [router],
  )

  const handleDeleteTask = useCallback((taskId: string) => {
    setTaskToDelete(taskId)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDeleteTask = useCallback(() => {
    if (taskToDelete) {
      deleteTask(taskToDelete)
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted",
      })
      loadTasks()
    }
    setIsDeleteDialogOpen(false)
    setTaskToDelete(null)
  }, [taskToDelete, toast, loadTasks])

  const handleStatusChange = useCallback(
    (taskId: string, status: "todo" | "in-progress" | "completed") => {
      updateTask(taskId, { status })
      toast({
        title: "Task updated",
        description: `Task status changed to ${status.replace("-", " ")}`,
      })
      loadTasks()
    },
    [toast, loadTasks],
  )

  const toggleFavorite = useCallback((taskId: string) => {
    setFavoriteTaskIds((prev) => {
      const updatedFavorites = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]

      localStorage.setItem("favorite_tasks", JSON.stringify(updatedFavorites))
      return updatedFavorites
    })
  }, [])

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <Clock className="h-4 w-4 text-gray-500" />
      case "in-progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "completed") return false
    const today = new Date()
    const taskDueDate = new Date(dueDate)
    return taskDueDate < today
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
                <p className="mt-4">Loading tasks...</p>
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
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                <h2 className="text-lg font-medium flex items-center">
                  {activeTab === "all" && <ListTodo className="mr-2 h-5 w-5 text-primary" />}
                  {activeTab === "assigned" && <Clock className="mr-2 h-5 w-5 text-primary" />}
                  {activeTab === "created" && <User2 className="mr-2 h-5 w-5 text-primary" />}
                  {activeTab === "completed" && <CheckCircle className="mr-2 h-5 w-5 text-primary" />}
                  {activeTab === "favorites" && <Star className="mr-2 h-5 w-5 text-primary" />}
                  <span className="capitalize">
                    {activeTab === "all"
                      ? "All Tasks"
                      : activeTab === "assigned"
                        ? "Tasks Assigned to Me"
                        : activeTab === "created"
                          ? "Tasks Created by Me"
                          : activeTab === "completed"
                            ? "Completed Tasks"
                            : "Favorite Tasks"}
                  </span>
                </h2>
              </div>
              <Button
                onClick={() => router.push("/tasks/new")}
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Task
              </Button>
            </div>

            {/* Task Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{allTasks.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {allTasks.filter((t) => t.status === "todo").length} to do,{" "}
                      {allTasks.filter((t) => t.status === "in-progress").length} in progress
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{completionRate}%</div>
                    <Progress value={completionRate} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">
                      {allTasks.filter((t) => isOverdue(t.dueDate, t.status)).length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">{completedTasks.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Great job! Keep it up</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status-filter" className="sr-only">
                      Filter by Status
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter" className="w-full">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority-filter" className="sr-only">
                      Filter by Priority
                    </Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger id="priority-filter" className="w-full">
                        <SelectValue placeholder="Filter by Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <Label htmlFor="sort-by" className="sr-only">
                      Sort By
                    </Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger id="sort-by" className="w-full">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-0 h-full"
                      onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Tabs and List */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <ListTodo className="h-4 w-4" />
                  <span>All Tasks</span>
                </TabsTrigger>
                <TabsTrigger value="assigned" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Assigned to Me</span>
                </TabsTrigger>
                <TabsTrigger value="created" className="flex items-center gap-1">
                  <User2 className="h-4 w-4" />
                  <span>Created by Me</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>Favorites</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <ListTodo className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No tasks found</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                      {activeTab === "all"
                        ? "You don't have any tasks yet. Create your first task to get started."
                        : `No tasks in the ${activeTab} category match your filters.`}
                    </p>
                    {activeTab === "all" && (
                      <Button onClick={() => router.push("/tasks/new")} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Task
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={`overflow-hidden ${isOverdue(task.dueDate, task.status) ? "border-red-300" : ""}`}
                        >
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row">
                              {/* Status indicator */}
                              <div
                                className={`w-full sm:w-1 h-1 sm:h-auto ${
                                  task.status === "completed"
                                    ? "bg-green-500"
                                    : task.status === "in-progress"
                                      ? "bg-blue-500"
                                      : "bg-gray-300"
                                }`}
                              />

                              <div className="p-4 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={task.status === "completed"}
                                      onCheckedChange={(checked) => {
                                        handleStatusChange(task.id, checked ? "completed" : "todo")
                                      }}
                                    />
                                    <h3
                                      className={`font-medium text-lg ${
                                        task.status === "completed" ? "line-through text-muted-foreground" : ""
                                      }`}
                                    >
                                      {task.title}
                                    </h3>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Badge className={getPriorityColor(task.priority)}>
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </Badge>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      {getStatusIcon(task.status)}
                                      <span className="ml-1 capitalize">{task.status.replace("-", " ")}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleFavorite(task.id)}
                                      className="text-yellow-500"
                                    >
                                      {favoriteTaskIds.includes(task.id) ? (
                                        <Star className="h-4 w-4 fill-yellow-500" />
                                      ) : (
                                        <StarOff className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-2">
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center">
                                      <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                                      <span
                                        className={
                                          isOverdue(task.dueDate, task.status) ? "text-red-500 font-medium" : ""
                                        }
                                      >
                                        {formatDate(task.dueDate)}
                                        {isOverdue(task.dueDate, task.status) && " (Overdue)"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Assigned to: </span>
                                      <span>{getAssigneeName(task.assignedTo)}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/tasks/${task.id}`)}
                                    >
                                      View Details
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}/edit`)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(task.id, "todo")}
                                          disabled={task.status === "todo"}
                                        >
                                          <Clock className="h-4 w-4 mr-2" />
                                          Mark as To Do
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(task.id, "in-progress")}
                                          disabled={task.status === "in-progress"}
                                        >
                                          <AlertCircle className="h-4 w-4 mr-2" />
                                          Mark as In Progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleStatusChange(task.id, "completed")}
                                          disabled={task.status === "completed"}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Mark as Completed
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="text-red-500"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  )
}
