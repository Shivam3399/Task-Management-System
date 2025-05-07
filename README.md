# Task_Management_System
A comprehensive task management application built with Next.js, featuring user authentication, task tracking, team management, and real-time notifications.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Authentication System](#authentication-system)
- [Task Management](#task-management)
- [Team Management](#team-management)
- [Notifications](#notifications)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)


## Overview

Task Management System is a full-featured web application designed to help teams organize, track, and manage tasks efficiently. Built with Next.js and React, it provides a responsive and intuitive interface for managing projects and tasks across teams.

## Features

### Authentication

- User registration with password strength validation
- Secure login with "Remember Me" functionality
- Password reset flow
- Account locking after failed attempts
- User profile management


### Task Management

- Create, view, edit, and delete tasks
- Task filtering and sorting
- Task categorization by priority and status
- Due date tracking with overdue notifications
- Task assignment to team members


### Team Management

- Team member management
- Role-based permissions
- Task assignment tracking
- Team activity monitoring


### Notifications

- Real-time task assignment notifications
- Task update notifications
- Overdue task alerts
- Customizable notification preferences


## Technical Architecture

### Frontend

- **Framework**: Next.js 14 with App Router
- **UI Components**: Shadcn UI with Tailwind CSS
- **State Management**: React Hooks and Context API
- **Authentication**: Custom authentication system with localStorage and IndexedDB


### Backend

- **API Routes**: Next.js API routes for server-side operations
- **Database**: PostgreSQL (simulated with localStorage for demo)
- **Authentication**: Token-based authentication


### Data Storage

- **Client-side Storage**:

- localStorage for session management and remembered users
- IndexedDB for user data and offline capabilities





## Authentication System

### User Registration (`app/auth/register/page.tsx`)

The registration system allows users to create accounts with secure password requirements:

- Minimum length validation
- Special character requirements
- Case sensitivity checks
- Password strength meter


```javascript
// Password validation logic
const validatePasswordStrength = (password) => {
  // Checks for minimum length, uppercase, lowercase, numbers, and special characters
  // Returns a score and detailed feedback
}
```

### Login System (`app/auth/login/page.tsx`)

The login system provides:

- Email and password authentication
- "Remember Me" functionality for quick login
- Account locking after multiple failed attempts
- Password visibility toggle


```javascript
// Remember Me functionality
if (rememberMe) {
  // Generate a token for the user
  const token = Date.now().toString(36) + Math.random().toString(36).substring(2)
  
  // Create a remembered user object with 30-day expiration
  const rememberedUser = {
    token,
    name: user.name,
    email: user.email,
    // Additional user data...
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
  
  // Save to localStorage for persistent login
}
```

### Password Reset (`app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`)

The password reset flow includes:

- Email-based reset request
- Secure token generation
- Token validation
- New password creation with strength validation


### Authentication Guard (`components/auth-guard.tsx`)

Protects routes from unauthorized access:

```javascript
export function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated") === "true"
      setIsAuthenticated(auth)
      
      if (!auth) {
        router.push("/auth/login")
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [router])

  if (isLoading) {
    return <LoadingScreen />
  }

  return isAuthenticated ? children : null
}
```

## Task Management

### Task Storage (`utils/task-storage.ts`)

The task storage system provides functions for:

- Creating tasks
- Retrieving tasks
- Updating tasks
- Deleting tasks
- Filtering tasks by various criteria


```javascript
// Task interface
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

// Add a new task
export function addTask(task: Omit<Task, "id">): Task {
  const tasks = getTasks()
  const newTask = {
    ...task,
    id: Date.now().toString(), // Generate a unique ID
  }

  tasks.push(newTask)
  saveTasks(tasks)

  // Create notification for assigned user
  if (task.assignedTo && task.assignedTo !== getCurrentUserId()) {
    createTaskAssignmentNotification(newTask.id, task.title, task.assignedTo)
  }

  return newTask
}
```

### Task Dashboard (`app/dashboard/page.tsx`)

The dashboard provides:

- Overview of all tasks
- Task statistics (total, completed, overdue)
- Filtering by assignment, creation, status
- Quick access to task creation


```javascript
// Calculate task statistics
const myTasks = [...new Set([...assignedTasks, ...createdTasks])]
const totalTasks = myTasks.length
const completedTasksCount = completedTasks.length
const overdueTasksCount = overdueTasks.length
const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0
```

### Task List (`components/task-list.tsx`)

The task list component provides:

- Sortable and filterable task list
- Search functionality
- Priority and status filtering
- Due date tracking
- Task actions (view, edit, delete)


```javascript
// Apply sorting and filtering
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
```

### Task Detail (`app/tasks/[id]/page.tsx`)

The task detail page provides:

- Comprehensive task information
- Status and priority indicators
- Edit and delete functionality
- Assignment information


### Task Creation and Editing (`app/tasks/new/page.tsx`, `app/tasks/[id]/edit/page.tsx`)

The task creation and editing forms provide:

- Title and description fields
- Priority and status selection
- Due date selection with calendar
- Team member assignment


## Team Management

### Team Overview (`app/team/page.tsx`)

The team page provides:

- List of all team members
- Member roles and responsibilities
- Activity tracking


### Team Roles (`app/team/roles/page.tsx`)

The roles page provides:

- Role definition and management
- Permission assignment
- Role-based access control


### Task Assignments (`app/team/assignments/page.tsx`)

The assignments page provides:

- Overview of task assignments by team member
- Workload balancing
- Assignment history


## Notifications

### Notification System (`components/task-notification.tsx`)

The notification system provides:

- Real-time notifications for task assignments
- Task update notifications
- Notification management
- Read/unread status tracking


```javascript
// Create a task assignment notification
export function createTaskAssignmentNotification(taskId, taskTitle, assigneeId) {
  // Get current user name from localStorage
  const currentUser = localStorage.getItem("userName") || "A team member"

  return addNotification({
    title: "New Task Assignment",
    message: `${currentUser} assigned you the task: ${taskTitle}`,
    type: "task",
    recipientId: assigneeId,
    relatedId: taskId,
  })
}
```

### Notification Bell (`components/notification-bell.tsx`)

The notification bell provides:

- Visual indicator of unread notifications
- Dropdown menu for notification access
- Quick actions for notifications


## Installation

1. Clone the repository:

```shellscript
git clone https://github.com/yourusername/task-management-system.git
cd task-management-system
```


2. Install dependencies:

```shellscript
npm install
```


3. Run the development server:

```shellscript
npm run dev
```


4. Open [http://localhost:3000](http://localhost:3000) in your browser.


## Usage Guide

### User Registration and Login

1. Navigate to the registration page
2. Create an account with a strong password
3. Log in with your credentials
4. Optionally enable "Remember Me" for quick login


### Creating Tasks

1. Click "Create Task" on the dashboard
2. Fill in the task details (title, description, priority, status)
3. Set a due date
4. Assign the task to a team member
5. Submit the form


### Managing Tasks

1. View all tasks on the dashboard
2. Filter tasks by assignment, creation, status
3. Sort tasks by various criteria
4. Search for specific tasks
5. Edit or delete tasks as needed


### Team Management

1. Navigate to the Team page
2. View team members and their roles
3. Assign tasks to team members
4. Track team activity and performance


## API Documentation

### Task API

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task


### User API

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user


## Troubleshooting

### Database Issues

If you encounter database issues:

1. Check the database connection in the admin panel
2. Run the database diagnostics tool
3. Reset the database if necessary (caution: this will delete all data)


```javascript
// Database diagnostics
export async function diagnoseDatabaseIssues() {
  try {
    console.log("Starting database diagnostics...")

    // Check if database exists
    const status = await IndexedDB.checkDatabaseStatus()
    console.log("Database status:", status)

    if (!status.exists) {
      console.error("Database does not exist!")
      return {
        status: "error",
        message: "Database does not exist",
        details: status,
      }
    }

    // Additional checks...
  } catch (error) {
    console.error("Error during database diagnostics:", error)
    return {
      status: "error",
      message: "Error during database diagnostics",
      details: error,
    }
  }
}
```

### Authentication Issues

If you encounter authentication issues:

1. Clear browser cookies and localStorage
2. Try logging in with a different browser
3. Reset your password if necessary


### Task Management Issues

If tasks are not displaying correctly:

1. Check the console for errors
2. Verify that tasks are being saved correctly
3. Try refreshing the page or clearing the cache


---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.


[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/shivam-singhs-projects-788bc9d2/task-management-system)

## Deployment

Your project is live at:

**[https://vercel.com/shivam-singhs-projects-788bc9d2/task-management-system](https://vercel.com/shivam-singhs-projects-788bc9d2/task-management-system)**
