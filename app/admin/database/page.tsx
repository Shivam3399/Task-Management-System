"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { diagnoseDatabaseIssues, fixDatabaseIssues, resetDatabase } from "@/utils/db-diagnostics"

export default function DatabaseTroubleshootingPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const result = await diagnoseDatabaseIssues()
      setDiagnosticResult(result)
    } catch (error) {
      console.error("Error running diagnostics:", error)
      toast({
        variant: "destructive",
        title: "Diagnostic Error",
        description: "Failed to run database diagnostics",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFixIssues = async () => {
    setIsFixing(true)
    try {
      const result = await fixDatabaseIssues()
      setDiagnosticResult(result)
      toast({
        title: "Fix Attempted",
        description: result.message,
      })
      // Run diagnostics again to see if issues were fixed
      await runDiagnostics()
    } catch (error) {
      console.error("Error fixing issues:", error)
      toast({
        variant: "destructive",
        title: "Fix Error",
        description: "Failed to fix database issues",
      })
    } finally {
      setIsFixing(false)
    }
  }

  const handleResetDatabase = async () => {
    if (!window.confirm("Are you sure you want to reset the database? This will delete all data.")) {
      return
    }

    setIsResetting(true)
    try {
      const result = await resetDatabase()
      toast({
        title: "Database Reset",
        description: "Database has been reset successfully",
      })
      // Run diagnostics again
      await runDiagnostics()
    } catch (error) {
      console.error("Error resetting database:", error)
      toast({
        variant: "destructive",
        title: "Reset Error",
        description: "Failed to reset database",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Troubleshooting</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Diagnostics</CardTitle>
            <CardDescription>Check the health of your database</CardDescription>
          </CardHeader>
          <CardContent>
            {diagnosticResult ? (
              <div className="space-y-4">
                <Alert variant={diagnosticResult.status === "ok" ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {diagnosticResult.status === "ok" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <AlertTitle>{diagnosticResult.status === "ok" ? "Healthy" : "Issues Detected"}</AlertTitle>
                  </div>
                  <AlertDescription>{diagnosticResult.message}</AlertDescription>
                </Alert>

                <div className="mt-4 border rounded-md p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Diagnostic Details</h3>
                  <div className="text-sm">
                    <p>Database exists: {diagnosticResult.details?.status?.exists ? "Yes" : "No"}</p>
                    <p>Stores: {diagnosticResult.details?.status?.stores?.join(", ") || "None"}</p>
                    <p>User count: {diagnosticResult.details?.status?.userCount || 0}</p>
                  </div>

                  {diagnosticResult.details?.users && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Users in Database</h4>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(diagnosticResult.details.users, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Run diagnostics to see database status</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={runDiagnostics} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Diagnostics
                </>
              )}
            </Button>
            <div className="space-x-2">
              <Button
                onClick={handleFixIssues}
                disabled={isFixing || !diagnosticResult || diagnosticResult.status === "ok"}
              >
                {isFixing ? "Fixing..." : "Fix Issues"}
              </Button>
              <Button variant="destructive" onClick={handleResetDatabase} disabled={isResetting}>
                {isResetting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset Database
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Guide</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Cannot Login</h3>
                <p className="text-sm text-muted-foreground">
                  If you cannot login despite having registered, try the following:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Run database diagnostics to check if your user exists</li>
                  <li>Try resetting your password</li>
                  <li>If all else fails, reset the database and register again</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">User Count is 0</h3>
                <p className="text-sm text-muted-foreground">If the user count shows 0 despite having registered:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Click "Fix Issues" to attempt automatic repair</li>
                  <li>Check if your browser has IndexedDB enabled</li>
                  <li>Try using a different browser</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">Database Errors</h3>
                <p className="text-sm text-muted-foreground">If you're seeing database errors:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Clear your browser cache and cookies</li>
                  <li>Make sure you're not in private/incognito mode</li>
                  <li>Check if your browser storage is full</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
