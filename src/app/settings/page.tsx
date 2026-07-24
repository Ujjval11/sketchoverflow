"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { updateProfile, uploadAvatar, updateTheme } from "@/lib/supabase/actions"
import { useTheme } from "@/components/theme-provider"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { setProfile(d.profile); setAvatarUrl(d.user?.avatarUrl) }).catch(() => {})
  }, [])

  if (!user) return null

  async function handleProfile(form: FormData) {
    setMessage("")
    const res = await updateProfile(form)
    if (res?.success) setMessage("Profile updated!")
    else if (res?.error) setMessage(res.error)
  }

  async function handleAvatar(form: FormData) {
    const res = await uploadAvatar(form)
    if (res?.avatarUrl) setAvatarUrl(res.avatarUrl)
    else setMessage(res?.error || "Upload failed")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {message && <p className="text-sm bg-primary/5 text-primary rounded-lg p-3">{message}</p>}

      <Card>
        <CardHeader><CardTitle>Avatar</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar src={avatarUrl} name={user.name || user.email} size="lg" />
            <form action={handleAvatar} className="flex items-center gap-3">
              <input type="file" name="avatar" accept="image/*" className="text-sm" />
              <Button type="submit" size="sm">Upload</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent>
          <form action={handleProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" defaultValue={user.name || ""} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={profile?.phone || ""} />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input name="age" type="number" defaultValue={profile?.age || ""} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input name="city" defaultValue={profile?.city || ""} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input name="country" defaultValue={profile?.country || ""} />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input name="institution" defaultValue={profile?.institution || ""} />
              </div>
              <div className="space-y-2">
                <Label>Education Level</Label>
                <Input name="educationLevel" defaultValue={profile?.educationLevel || ""} />
              </div>
              <div className="space-y-2">
                <Label>Exam</Label>
                <Input name="exam" defaultValue={profile?.exam || ""} />
              </div>
              <div className="space-y-2">
                <Label>Study Mode</Label>
                <Input name="studyMode" defaultValue={profile?.studyMode || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <textarea name="bio" defaultValue={profile?.bio || ""} className="flex h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Goals</Label>
                <Input name="goals" defaultValue={profile?.goals || ""} />
              </div>
              <div className="space-y-2">
                <Label>Interests</Label>
                <Input name="interests" defaultValue={profile?.interests || ""} />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(["light", "dark", "system"] as const).map(t => (
              <button key={t} onClick={() => { setTheme(t); updateTheme(t) }}
                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${theme === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
