// Define the Task type
import { addNotification, createTaskAssignmentNotification } from "@/components/task-notification"

export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high" | "critical"
  dueDate: string
  assignedTo: string
  createdBy: string
}

// Initial mock data
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Complete project documentation",
    description: "Write comprehensive documentation for the new feature",
    status: "in-progress",
    priority: "high",
    dueDate: "2023-12-15",
    assignedTo: "user1",
    createdBy: "currentUser",
  },
  {
    id: "2",
    title: "Fix login bug",
    description: "Address the issue with login on mobile devices",
    status: "todo",
    priority: "critical",
    dueDate: "2023-12-10",
    assignedTo: "currentUser",
    createdBy: "user2",
  },
  {
    id: "3",
    title: "Review pull requests",
    description: "Review and merge pending pull requests",
    status: "completed",
    priority: "medium",
    dueDate: "2023-12-05",
    assignedTo: "currentUser",
    createdBy: "user3",
  },
  {
    id: "4",
    title: "Update dependencies",
    description: "Update all project dependencies to the latest versions",
    status: "todo",
    priority: "low",
    dueDate: "2023-12-20",
    assignedTo: "user4",
    createdBy: "currentUser",
  },
]

// Get tasks from localStorage or use initial data
export function getTasks(): Task[] {
  if (typeof window === "undefined") return initialTasks

  const storedTasks = localStorage.getItem("tasks")
  if (!storedTasks) {
    localStorage.setItem("tasks", JSON.stringify(initialTasks))
    return initialTasks
  }

  return JSON.parse(storedTasks)
}

// Save tasks to localStorage
export function saveTasks(tasks: Task[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }
}

// Get the current user's ID from localStorage
export function getCurrentUserId(): string {
  if (typeof window !== "undefined") {
    // Try to get the user email from localStorage
    const userEmail = localStorage.getItem("userEmail")
    if (userEmail) {
      console.log("Current user ID (from email):", userEmail)
      return userEmail
    }

    // Fallback to "currentUser" for demo purposes
    console.log("Using fallback current user ID: currentUser")
    return "currentUser"
  }
  return "currentUser"
}

// Add a new task
export function addTask(task: Omit<Task, "id">): Task {
  const tasks = getTasks()
  const newTask = {
    ...task,
    id: Date.now().toString(), // Generate a unique ID
  }

  tasks.push(newTask)
  saveTasks(tasks)

  // Add notification for the assigned user
  if (task.assignedTo && task.assignedTo !== getCurrentUserId()) {
    console.log(`Creating notification for task assignment: ${task.title} to ${task.assignedTo}`)
    createTaskAssignmentNotification(newTask.id, task.title, task.assignedTo)
  }

  return newTask
}

// Update an existing task
export function updateTask(taskId: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks()
  const taskIndex = tasks.findIndex((task) => task.id === taskId)

  if (taskIndex === -1) return null

  const originalTask = tasks[taskIndex]
  tasks[taskIndex] = { ...originalTask, ...updates }
  saveTasks(tasks)

  // If assignment has changed, notify the new assignee
  if (updates.assignedTo && updates.assignedTo !== originalTask.assignedTo) {
    console.log(`Task reassigned: ${tasks[taskIndex].title} to ${updates.assignedTo}`)

    // Get the current user's name for the notification
    const userName = localStorage.getItem("userName") || "A team member"

    addNotification({
      title: "Task Reassigned",
      message: `${userName} has reassigned a task to you: ${tasks[taskIndex].title}`,
      type: "task",
      recipientId: updates.assignedTo,
      relatedId: taskId,
    })
  }

  return tasks[taskIndex]
}

// Delete a task
export function deleteTask(taskId: string): boolean {
  const tasks = getTasks()
  const filteredTasks = tasks.filter((task) => task.id !== taskId)

  if (filteredTasks.length === tasks.length) return false

  saveTasks(filteredTasks)
  return true
}

// Get tasks assigned to the current user
export function getTasksAssignedToMe(): Task[] {
  const currentUserId = getCurrentUserId()
  return getTasks().filter((task) => task.assignedTo === currentUserId)
}

// Get tasks created by the current user
export function getTasksCreatedByMe(): Task[] {
  const currentUserId = getCurrentUserId()
  return getTasks().filter((task) => task.createdBy === currentUserId)
}

export function getAllTasks(): Task[] {
  return getTasks()
}
