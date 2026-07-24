"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { signUp } from "@/lib/supabase/actions"
import { useState } from "react"

export default function RegisterPage() {
  const [error, setError] = useState("")

  async function handleSubmit(form: FormData) {
    const res = await signUp(form)
    if (res?.error) setError(res.error)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Start your drawing journey</p>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-error bg-error/5 rounded-lg p-3 mb-4">{error}</p>}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
