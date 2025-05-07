"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Camera, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AvatarUploadProps {
  name: string
  currentAvatar?: string | null
  onAvatarChange: (avatarUrl: string | null) => void
}

export function AvatarUpload({ name, currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatar || null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 5MB",
      })
      return
    }

    // Create a URL for the file
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
    onAvatarChange(url)

    // Close the dialog
    setIsDialogOpen(false)

    toast({
      title: "Avatar updated",
      description: "Your profile picture has been updated successfully",
    })
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null)
    onAvatarChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "Avatar removed",
      description: "Your profile picture has been removed",
    })
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={avatarUrl || ""} alt={name} />
        <AvatarFallback className="text-4xl">{getInitials(name)}</AvatarFallback>
      </Avatar>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Change Avatar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || ""} alt={name} />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>

              <div className="flex gap-2">
                <Label
                  htmlFor="avatar-upload"
                  className="flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Upload Image
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {avatarUrl && (
                  <Button variant="outline" size="sm" onClick={handleRemoveAvatar}>
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">Recommended: Square image, at least 200x200 pixels, maximum 5MB.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
