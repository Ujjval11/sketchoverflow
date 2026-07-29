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

  const skillOptions = ["Beginner", "Intermediate", "Advanced", "Professional"]
  const artStyles = ["Realism", "Anime/Manga", "Cartoon", "Abstract", "Portrait", "Landscape", "Fantasy", "Character Design", "Sketching", "Digital Art", "Traditional", "Comic"]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {message && <p className="text-sm bg-gradient-to-r from-primary/10 to-secondary/10 text-primary rounded-lg p-3">{message}</p>}

      <Card>
        <CardHeader><CardTitle>Avatar</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="ring-2 ring-primary/20 rounded-full"><Avatar src={avatarUrl} name={user.name || user.email} size="lg" /></div>
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
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <textarea name="bio" defaultValue={profile?.bio || ""} placeholder="Tell the world about your art journey..." className="flex h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input name="age" type="number" defaultValue={profile?.age || ""} placeholder="Your age" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={profile?.phone || ""} placeholder="+1 234 567 890" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input name="city" defaultValue={profile?.city || ""} placeholder="e.g. New York" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input name="country" defaultValue={profile?.country || ""} placeholder="e.g. USA" />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-3">Art & Education</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <select name="educationLevel" defaultValue={profile?.educationLevel || ""}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                    <option value="">Select level</option>
                    {skillOptions.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input name="institution" defaultValue={profile?.institution || ""} placeholder="School / College" />
                </div>
                <div className="space-y-2">
                  <Label>Study Mode</Label>
                  <select name="studyMode" defaultValue={profile?.studyMode || ""}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                    <option value="">Select mode</option>
                    <option value="self-taught">Self-taught</option>
                    <option value="online">Online Courses</option>
                    <option value="formal">Formal Education</option>
                    <option value="mentorship">Mentorship</option>
                    <option value="workshop">Workshops</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Exam Prep</Label>
                  <Input name="exam" defaultValue={profile?.exam || ""} placeholder="e.g. NID, NIFT" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-3">Art Interests</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Art Styles</Label>
                  <select name="interests" defaultValue={profile?.interests || ""}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                    <option value="">Select style</option>
                    {artStyles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Goals</Label>
                  <select name="goals" defaultValue={profile?.goals || ""}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                    <option value="">Select goal</option>
                    <option value="practice">Daily Practice</option>
                    <option value="hobby">Hobby / Fun</option>
                    <option value="professional">Professional Growth</option>
                    <option value="exam">Exam / Portfolio Prep</option>
                  </select>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(["light", "dark", "system"] as const).map(t => (
              <button key={t} onClick={() => { setTheme(t); updateTheme(t) }}
                className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${theme === t ? "border-primary bg-gradient-to-r from-primary/10 to-secondary/10 text-primary shadow-sm" : "border-border hover:bg-muted"}`}
              >
                {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
