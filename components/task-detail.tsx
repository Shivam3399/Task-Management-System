'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Clock, Edit, Trash2, ArrowLeft, CheckCircle, AlertCircle, User, Tag, Calendar, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { deleteTask, updateTask } from '@/app/actions/tasks'
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
import DashboardHeader from '@/components/dashboard-header'

export default function TaskDetail({ 
  task, 
  categories, 
  statuses,
  teamMembers,
  currentUser
}: { 
  task: any;
  categories: any[];
  statuses: any[];
  teamMembers: any[];
  currentUser: any;
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Format the due date
  const formattedDueDate = task.due_date ? format(new Date(task.due_date), 'PPP') : 'No due date'
  
  // Check if task is overdue
  const isOverdue = () => {
    if (task.status_name === 'completed') return false
    const today = new Date()
    const dueDate = new Date(task.due_date)
    return dueDate < today
  }

  // Get status color
  const getStatusColor = () => {
    switch (task.status_name) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'todo':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get priority color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'low':
        return 'bg-gray-500'
      case 'medium':
        return 'bg-blue-500'
      case 'high':
        return 'bg-orange-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Handle task deletion
  const handleDeleteTask = async () => {
    setIsLoading(true)
    try {
      await deleteTask(task.id, currentUser.id)
      toast({
        title: 'Task deleted',
        description: 'The task has been successfully deleted',
      })
      router.push('/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        variant: 'destructive',
        title: 'Error deleting task',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Handle status change
  const handleStatusChange = async (statusName: string) => {
    setIsLoading(true)
    try {
      const statusId = statuses.find(s => s.name === statusName)?.id
      if (!statusId) throw new Error('Invalid status')
      
      await updateTask(task.id, { 
        status_id: statusId,
        updated_by: currentUser.id
      })
      
      toast({
        title: 'Task updated',
        description: `Task status changed to ${statusName.replace('-', ' ')}`,
      })
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        variant: 'destructive',
        title: 'Error updating task',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/tasks')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
            
            <Card>
              <CardHeader className="relative pb-2">
                <div className="absolute top-0 left-0 w-full h-1 flex">
                  <div className={`h-full ${getStatusColor()}`} style={{ width: '100%' }}></div>
                </div>
                <div className="pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor()}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {task.status_name === 'completed' ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : task.status_name === 'in-progress' ? (
                        <Clock className="h-3 w-3 text-blue-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-gray-500" />
                      )}
                      <span className="capitalize">{task.status_name.replace('-', ' ')}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    {task.description ? (
                      <p className="whitespace-pre-wrap">{task.description}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No description provided</p>
                    )}
                  </div>
                </div>
                
                {/* Task details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Due Date</p>
                          <p className={isOverdue() ? "text-red-500" : ""}>
                            {formattedDueDate}
                            {isOverdue() && " (Overdue)"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Tag className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Category</p>
                          <p>{task.category_name || 'Uncategorized'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Priority</p>
                          <p className="capitalize">{task.priority}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">People</h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Created By</p>
                          <p>{task.created_by_username || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Assigned To</p>
                          <p>{task.assigned_to_username || 'Unassigned'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <CalendarIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Created At</p>
                          <p>{format(new Date(task.created_at), 'PPP')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status change buttons */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Change Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(status => (
                      <Button
                        key={status.id}
                        variant={task.status_id === status.id ? "default" : "outline"}
                        size="sm"
                        disabled={task.status_id === status.id || isLoading}
                        onClick={() => handleStatusChange(status.name)}
                      >
                        {status.name === 'completed' ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : status.name === 'in-progress' ? (
                          <Clock className="h-4 w-4 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-1" />
                        )}
                        <span className="capitalize">{status.name.replace('-', ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/tasks/${task.id}/edit`)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      
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
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
