"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardHeader from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"
import { getTasks } from "@/utils/task-storage"

// Mock team members
const teamMembers = [
  {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
    role: "Project Manager",
    avatar: null,
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Developer",
    avatar: null,
  },
  {
    id: "user3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Designer",
    avatar: null,
  },
  {
    id: "currentUser",
    name: "You",
    email: "you@example.com",
    role: "Developer",
    avatar: null,
  },
]

export default function TaskAssignmentsPage() {
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Get tasks from storage
  const allTasks = getTasks()

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Generate a color based on the user's email (for visual distinction)
  const getColorFromEmail = (email: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-teal-500",
    ]

    // Simple hash function to get a consistent color for each email
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  // Get member name by ID
  const getMemberName = (id: string) => {
    const member = teamMembers.find((m) => m.id === id)
    return member ? member.name : "Unknown"
  }

  // Filter tasks based on selected filter and search term
  const filteredTasks = allTasks.filter((task) => {
    // Filter by assignee
    if (filter !== "all" && task.assignedTo !== filter) {
      return false
    }

    // Filter by search term
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    return true
  })

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">Task Assignments</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/2">
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Team Members</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Task Assignments</CardTitle>
                <CardDescription>
                  {filter === "all"
                    ? "All tasks assigned to team members"
                    : `Tasks assigned to ${getMemberName(filter)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredTasks.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No tasks found matching your criteria.</p>
                  ) : (
                    filteredTasks.map((task) => {
                      const assignee = teamMembers.find((m) => m.id === task.assignedTo)

                      return (
                        <div key={task.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-medium">{task.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-end">
                                <Badge
                                  className={
                                    task.status === "completed"
                                      ? "bg-green-500"
                                      : task.status === "in-progress"
                                        ? "bg-blue-500"
                                        : "bg-gray-500"
                                  }
                                >
                                  {task.status === "in-progress"
                                    ? "In Progress"
                                    : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </Badge>
                                <span className="text-xs text-gray-500 mt-1">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              {assignee && (
                                <Avatar className={`h-8 w-8 ${getColorFromEmail(assignee.email)}`}>
                                  <AvatarImage src={assignee.avatar || ""} alt={assignee.name} />
                                  <AvatarFallback className="text-white text-xs">
                                    {getInitials(assignee.name)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
