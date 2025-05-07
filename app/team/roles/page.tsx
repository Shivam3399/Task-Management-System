"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardHeader from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"

export default function TeamRolesPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Team Roles & Responsibilities</h1>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Manager</CardTitle>
                  <CardDescription>Oversees project planning, execution, and delivery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Key Responsibilities:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Define project scope, goals, and deliverables</li>
                        <li>Develop project plans and schedules</li>
                        <li>Assign tasks to team members and track progress</li>
                        <li>Manage project resources and budget</li>
                        <li>Communicate with stakeholders and report on project status</li>
                        <li>Identify and mitigate project risks</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Required Skills:</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Leadership</Badge>
                        <Badge>Communication</Badge>
                        <Badge>Organization</Badge>
                        <Badge>Problem-solving</Badge>
                        <Badge>Risk Management</Badge>
                        <Badge>Budgeting</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Developer</CardTitle>
                  <CardDescription>Designs, builds, and maintains software applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Key Responsibilities:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Write clean, maintainable code according to specifications</li>
                        <li>Collaborate with designers to implement user interfaces</li>
                        <li>Debug and fix issues in existing code</li>
                        <li>Optimize application performance</li>
                        <li>Write and maintain documentation</li>
                        <li>Participate in code reviews</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Required Skills:</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge>JavaScript/TypeScript</Badge>
                        <Badge>React</Badge>
                        <Badge>Next.js</Badge>
                        <Badge>Node.js</Badge>
                        <Badge>Git</Badge>
                        <Badge>Problem-solving</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Designer</CardTitle>
                  <CardDescription>Creates visual designs and user experiences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Key Responsibilities:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Create wireframes, prototypes, and high-fidelity designs</li>
                        <li>Design user interfaces that are intuitive and accessible</li>
                        <li>Develop and maintain design systems</li>
                        <li>Collaborate with developers to implement designs</li>
                        <li>Conduct user research and usability testing</li>
                        <li>Stay updated on design trends and best practices</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Required Skills:</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge>UI Design</Badge>
                        <Badge>UX Design</Badge>
                        <Badge>Figma</Badge>
                        <Badge>Adobe Creative Suite</Badge>
                        <Badge>Prototyping</Badge>
                        <Badge>Visual Communication</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
