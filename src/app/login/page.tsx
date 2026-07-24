"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { signInWithEmail, signInWithGoogle, signInWithGithub } from "@/lib/supabase/actions"
import { useState } from "react"

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || ""
  const [error, setError] = useState("")

  async function handleEmail(form: FormData) {
    if (redirect) form.set("redirect", redirect)
    const res = await signInWithEmail(form)
    if (res?.error) setError(res.error)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Sign In</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to SketchOverFlow</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-error bg-error/5 rounded-lg p-3">{error}</p>}
        <form action={handleEmail} className="space-y-4">
          <input type="hidden" name="redirect" value={redirect} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <form action={signInWithGoogle}>
            <input type="hidden" name="redirect" value={redirect} />
            <Button type="submit" variant="outline" className="w-full">Google</Button>
          </form>
          <form action={signInWithGithub}>
            <input type="hidden" name="redirect" value={redirect} />
            <Button type="submit" variant="outline" className="w-full">GitHub</Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline">Sign up</Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/forgot-password" className="hover:underline">Forgot password?</Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
