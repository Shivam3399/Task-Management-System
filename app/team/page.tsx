"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DashboardHeader from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"
import { CheckCircle, Clock, Users, Briefcase, Search, Mail, Phone, Calendar, BarChart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock team data - in a real app, this would come from an API
const teamMembers = [
  {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    role: "Project Manager",
    avatar: null,
    tasks: 8,
    completedTasks: 5,
    joinDate: "2022-03-15",
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1 (555) 987-6543",
    role: "Developer",
    avatar: null,
    tasks: 12,
    completedTasks: 9,
    joinDate: "2022-05-22",
  },
  {
    id: "user3",
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "+1 (555) 456-7890",
    role: "Designer",
    avatar: null,
    tasks: 6,
    completedTasks: 4,
    joinDate: "2022-01-10",
  },
  {
    id: "currentUser",
    name: "You",
    email: "you@example.com",
    phone: "+1 (555) 789-0123",
    role: "Developer",
    avatar: null,
    tasks: 10,
    completedTasks: 7,
    joinDate: "2021-11-05",
  },
]

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState("members")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredMembers, setFilteredMembers] = useState(teamMembers)
  const [selectedMember, setSelectedMember] = useState(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    if (searchTerm) {
      setFilteredMembers(
        teamMembers.filter(
          (member) =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.role.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    } else {
      setFilteredMembers(teamMembers)
    }
  }, [searchTerm])

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

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleViewProfile = (member) => {
    setSelectedMember(member)
    setIsProfileModalOpen(true)
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Team Management</h1>
              <p className="text-muted-foreground mt-1">Manage your team members and their responsibilities</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team members..."
                  className="pl-9 w-full md:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-flex">
              <TabsTrigger value="members" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Team Members</span>
                <span className="sm:hidden">Members</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Roles & Responsibilities</span>
                <span className="sm:hidden">Roles</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Task Assignments</span>
                <span className="sm:hidden">Tasks</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="animate-fade-in">
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No team members found</h3>
                    <p className="text-muted-foreground mt-1">Try adjusting your search terms</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <Card key={member.id} className="hover-card overflow-hidden">
                      <div className={`h-2 ${getColorFromEmail(member.email)}`}></div>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <Avatar className={`h-16 w-16 ring-4 ring-white shadow-md`}>
                            <AvatarImage src={member.avatar || ""} alt={member.name} />
                            <AvatarFallback className={`${getColorFromEmail(member.email)} text-white text-lg`}>
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-lg">{member.name}</h3>
                            <Badge variant="outline" className="mt-1">
                              {member.role}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{member.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {formatDate(member.joinDate)}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Task Completion</span>
                            <span className="text-sm font-medium">
                              {Math.round((member.completedTasks / member.tasks) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className={`h-2 rounded-full ${getColorFromEmail(member.email)}`}
                              style={{ width: `${(member.completedTasks / member.tasks) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">{member.completedTasks} completed</span>
                            <span className="text-xs text-muted-foreground">
                              {member.tasks - member.completedTasks} remaining
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/50 px-6 py-3 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => window.open(`mailto:${member.email}`)}
                        >
                          <Mail className="h-3 w-3" />
                          Message
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleViewProfile(member)}
                        >
                          <Users className="h-3 w-3" />
                          View Profile
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="roles" className="animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Team Roles & Responsibilities
                  </CardTitle>
                  <CardDescription>Overview of roles and responsibilities within the team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="relative border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
                      <div className="absolute -top-3 left-4 bg-primary text-white px-3 py-1 rounded-md text-sm font-medium">
                        Project Manager
                      </div>
                      <div className="mt-3">
                        <p className="text-muted-foreground">
                          Responsible for planning, executing, and closing projects. Manages team resources, schedules,
                          and ensures project goals are met on time.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">Planning</Badge>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                            Coordination
                          </Badge>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                            Resource Management
                          </Badge>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                            Stakeholder Communication
                          </Badge>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1">
                            Risk Assessment
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
                      <div className="absolute -top-3 left-4 bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                        Developer
                      </div>
                      <div className="mt-3">
                        <p className="text-muted-foreground">
                          Designs, codes, tests, and debugs applications. Collaborates with other team members to
                          implement features and fix issues.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1">
                            Coding
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1">
                            Testing
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1">
                            Debugging
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1">
                            Code Review
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-3 py-1">
                            Documentation
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
                      <div className="absolute -top-3 left-4 bg-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                        Designer
                      </div>
                      <div className="mt-3">
                        <p className="text-muted-foreground">
                          Creates visual concepts, designs user interfaces, and ensures a consistent user experience
                          across the application.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1">
                            UI Design
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1">
                            UX Research
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1">
                            Prototyping
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1">
                            Visual Design
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1">
                            Accessibility
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Task Assignments
                  </CardTitle>
                  <CardDescription>Current task assignments for each team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                      >
                        <div className={`${getColorFromEmail(member.email)} h-1`}></div>
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className={`h-10 w-10 ${getColorFromEmail(member.email)}`}>
                              <AvatarFallback className="text-white">{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{member.name}</h3>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              <BarChart className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {member.completedTasks}/{member.tasks} tasks
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              Assigned Tasks:
                            </h4>
                            <ul className="space-y-2">
                              {member.id === "user1" && (
                                <>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Project planning documentation</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Team resource allocation</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Client meeting preparation</span>
                                    <div className="status-badge status-badge-completed">
                                      <CheckCircle className="h-3 w-3" />
                                      Completed
                                    </div>
                                  </li>
                                </>
                              )}
                              {member.id === "user2" && (
                                <>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>API integration</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Authentication system</span>
                                    <div className="status-badge status-badge-completed">
                                      <CheckCircle className="h-3 w-3" />
                                      Completed
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Dashboard implementation</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                </>
                              )}
                              {member.id === "user3" && (
                                <>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>UI component design</span>
                                    <div className="status-badge status-badge-completed">
                                      <CheckCircle className="h-3 w-3" />
                                      Completed
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Design system documentation</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Mobile responsive layouts</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                </>
                              )}
                              {member.id === "currentUser" && (
                                <>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Task management system</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>User profile functionality</span>
                                    <div className="status-badge status-badge-completed">
                                      <CheckCircle className="h-3 w-3" />
                                      Completed
                                    </div>
                                  </li>
                                  <li className="text-sm flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700">
                                    <span>Data visualization components</span>
                                    <div className="status-badge status-badge-in-progress">
                                      <Clock className="h-3 w-3" />
                                      In Progress
                                    </div>
                                  </li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        {/* Profile Modal */}
        {selectedMember && (
          <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className={`h-8 w-8 ${getColorFromEmail(selectedMember.email)}`}>
                    <AvatarFallback className="text-white">{getInitials(selectedMember.name)}</AvatarFallback>
                  </Avatar>
                  {selectedMember.name}
                </DialogTitle>
                <DialogDescription>{selectedMember.role}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{selectedMember.email}</span>

                  <span className="text-muted-foreground">Phone:</span>
                  <span>{selectedMember.phone}</span>

                  <span className="text-muted-foreground">Joined:</span>
                  <span>{formatDate(selectedMember.joinDate)}</span>

                  <span className="text-muted-foreground">Tasks:</span>
                  <span>
                    {selectedMember.completedTasks} completed of {selectedMember.tasks} total
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className={`h-2 rounded-full ${getColorFromEmail(selectedMember.email)}`}
                    style={{ width: `${(selectedMember.completedTasks / selectedMember.tasks) * 100}%` }}
                  ></div>
                </div>
              </div>
              <DialogFooter className="flex sm:justify-between">
                <Button
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => window.open(`mailto:${selectedMember.email}`)}
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button
                  variant="default"
                  className="flex items-center gap-1"
                  onClick={() => {
                    setIsProfileModalOpen(false)
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AuthGuard>
  )
}
