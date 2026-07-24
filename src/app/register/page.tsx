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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Start your drawing journey</p>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-error bg-error/5 rounded-lg p-3 mb-4">{error}</p>}
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea id="bio" name="bio" rows={2} placeholder="Tell us about yourself"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="goals">Goals</Label>
                <select id="goals" name="goals"
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">Select goal</option>
                  <option value="practice">Daily Practice</option>
                  <option value="hobby">Hobby / Fun</option>
                  <option value="professional">Professional Growth</option>
                  <option value="exam">Exam / Portfolio Prep</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="educationLevel">Education Level</Label>
                <select id="educationLevel" name="educationLevel"
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">Select level</option>
                  <option value="school">School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="self-taught">Self-taught</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" name="institution" placeholder="School / College" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Your city" />
              </div>
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
