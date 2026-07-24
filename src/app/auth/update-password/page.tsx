"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { updatePassword } from "@/lib/supabase/actions"
import { useState } from "react"

export default function UpdatePasswordPage() {
  const [error, setError] = useState("")

  async function handleSubmit(form: FormData) {
    const res = await updatePassword(form)
    if (res?.error) setError(res.error)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Update Password</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter your new password</p>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-error bg-error/5 rounded-lg p-3 mb-4">{error}</p>}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
