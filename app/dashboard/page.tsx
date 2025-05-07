"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle2, Clock, ListTodo, Users, ArrowUpRight } from "lucide-react"
import TaskList from "@/components/task-list"
import DashboardHeader from "@/components/dashboard-header"
import { useToast } from "@/components/ui/use-toast"
import { getTasks, getTasksAssignedToMe, getTasksCreatedByMe, getCurrentUserId, type Task } from "@/utils/task-storage"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [createdTasks, setCreatedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const initialLoadDone = useRef(false)

  // Handle initial data loading and tab selection
  useEffect(() => {
    if (initialLoadDone.current) return

    const loadData = () => {
      try {
        // Get view from URL or default to "assigned"
        const view = searchParams.get("view") || "assigned"

        // Load all tasks - make sure we're getting ALL tasks without filtering
        const loadedTasks = getTasks()
        console.log("All tasks loaded:", loadedTasks.length)
        setTasks(loadedTasks)

        // Load tasks assigned to the current user
        const assignedToMe = getTasksAssignedToMe()
        console.log("Assigned tasks loaded:", assignedToMe.length)
        setAssignedTasks(assignedToMe)

        // Load tasks created by the current user
        const createdByMe = getTasksCreatedByMe()
        console.log("Created tasks loaded:", createdByMe.length)
        setCreatedTasks(createdByMe)

        // Set active tab without triggering a re-render loop
        setActiveTab(view)

        // Mark initial load as done
        initialLoadDone.current = true
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [searchParams, toast])

  // Add this after the first useEffect
  useEffect(() => {
    // Only run once after initial load
    if (!initialLoadDone.current) return

    // Force a refresh once after the component has mounted and initial load is done
    const timer = setTimeout(() => {
      refreshTasks()
    }, 500)

    return () => clearTimeout(timer)
  }, [initialLoadDone.current]) // Only depend on initialLoadDone.current

  // Function to refresh tasks without causing a re-render loop
  const refreshTasks = () => {
    try {
      // Get fresh data directly from storage
      const allTasks = getTasks()
      console.log("All tasks in refreshTasks:", allTasks.length)
      setTasks(allTasks)

      // Get tasks assigned to the current user
      const assigned = getTasksAssignedToMe()
      console.log("Assigned tasks in refreshTasks:", assigned.length)
      setAssignedTasks(assigned)

      // Get tasks created by the current user
      const created = getTasksCreatedByMe()
      console.log("Created tasks in refreshTasks:", created.length)
      setCreatedTasks(created)
    } catch (error) {
      console.error("Error refreshing tasks:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh tasks",
      })
    }
  }

  const handleCreateTask = () => {
    router.push("/tasks/new")
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Only update URL if needed, using replace to avoid history stack issues
    const currentView = searchParams.get("view") || "assigned"
    if (value !== currentView) {
      router.replace(`/dashboard?view=${value}`, { scroll: false })
    }
  }

  // Don't render anything until we've determined the active tab
  if (isLoading || activeTab === null) {
    return (
      <AuthGuard>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4">Loading dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Filter tasks for overdue and completed
  const currentUserId = getCurrentUserId()
  const overdueTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    const today = new Date()
    return (
      dueDate < today &&
      task.status !== "completed" &&
      (task.assignedTo === currentUserId || task.createdBy === currentUserId)
    )
  })

  const completedTasks = tasks.filter(
    (task) => task.status === "completed" && (task.assignedTo === currentUserId || task.createdBy === currentUserId),
  )

  // Calculate task statistics
  const myTasks = [...new Set([...assignedTasks, ...createdTasks])]
  const totalTasks = myTasks.length
  const completedTasksCount = completedTasks.length
  const overdueTasksCount = overdueTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your tasks</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTask} className="animate-fade-in">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 animate-fade-in">
            <Card className="hover-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</p>
                    <p className="text-3xl font-bold">{tasks.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ListTodo className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                  <span>
                    {
                      tasks.filter((task) => {
                        const oneWeekAgo = new Date()
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                        return new Date(task.dueDate) > oneWeekAgo
                      }).length
                    }{" "}
                    new tasks this week
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-500">{completedTasksCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <span>{completionRate}% completion rate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Overdue</p>
                    <p className="text-3xl font-bold text-red-500">{overdueTasksCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <span>Requires immediate attention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Team Members</p>
                    <p className="text-3xl font-bold">4</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/team")}>
                    View team members
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="animate-fade-in">
            <TabsList className="mb-4 bg-background">
              <TabsTrigger
                value="assigned"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <ListTodo className="mr-2 h-4 w-4" />
                Assigned to Me
              </TabsTrigger>
              <TabsTrigger
                value="created"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Created by Me
              </TabsTrigger>
              <TabsTrigger
                value="overdue"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Clock className="mr-2 h-4 w-4" />
                Overdue
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assigned">
              <TaskList tasks={assignedTasks} onTasksChange={refreshTasks} />
            </TabsContent>

            <TabsContent value="created">
              <TaskList tasks={createdTasks} onTasksChange={refreshTasks} />
            </TabsContent>

            <TabsContent value="overdue">
              <TaskList tasks={overdueTasks} onTasksChange={refreshTasks} />
            </TabsContent>

            <TabsContent value="completed">
              <TaskList tasks={completedTasks} onTasksChange={refreshTasks} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
