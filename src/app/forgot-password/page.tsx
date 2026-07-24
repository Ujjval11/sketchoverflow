"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { resetPassword } from "@/lib/supabase/actions"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(form: FormData) {
    const res = await resetPassword(form)
    if (res?.error) setError(res.error)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8 space-y-4">
            <div className="text-4xl">📧</div>
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-muted-foreground">We sent you a password reset link.</p>
            <Link href="/login"><Button variant="outline">Back to Sign In</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Reset Password</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-error bg-error/5 rounded-lg p-3">{error}</p>}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <Button type="submit" className="w-full">Send Reset Link</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">Back to Sign In</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
