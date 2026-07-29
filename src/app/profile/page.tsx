"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()).catch(() => ({})),
      fetch("/api/practice-stats").then(r => r.json()).catch(() => ({})),
    ]).then(([p, s]) => { setProfile(p); setStats(s) })
  }, [])

  if (!user) return null

  const userData = profile?.user || user
  const profileData = profile?.profile
  const s = stats || {}

  function fmtDate(iso?: string) {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  function fmtDuration(seconds: number) {
    if (!seconds) return "0m"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const avatarColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <CardContent className="relative p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
              <div className="w-full h-full rounded-full bg-background" />
            </div>
            <div className="w-24 h-24 rounded-full ring-4 ring-background overflow-hidden">
              <Avatar src={userData.avatarUrl} name={userData.name || userData.email} size="lg" />
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold">{userData.name || "Artist"}</h1>
            <p className="text-muted-foreground">{userData.email}</p>
            {profileData?.bio && <p className="text-sm mt-2 italic text-muted-foreground">&ldquo;{profileData.bio}&rdquo;</p>}
            <p className="text-xs text-muted-foreground mt-1">Joined {fmtDate(s.user?.joinedAt)}</p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="rounded-xl bg-gradient-to-b from-primary/10 to-primary/5 p-3 min-w-[72px]">
              <p className="text-xl font-bold">{s.level ?? 1}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 p-3 min-w-[72px]">
              <p className="text-xl font-bold">{s.streak ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-green-500/10 to-green-500/5 p-3 min-w-[72px]">
              <p className="text-xl font-bold">{s.coins ?? 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {s.xpProgress && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level {s.level} Progress</span>
              <span className="text-xs text-muted-foreground">{s.xpProgress.current} / {s.xpProgress.needed} XP</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${s.xpProgress.progress * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profileData?.phone && <p><span className="text-muted-foreground">Phone:</span> {profileData.phone}</p>}
            {profileData?.age && <p><span className="text-muted-foreground">Age:</span> {profileData.age}</p>}
            {profileData?.city && <p><span className="text-muted-foreground">City:</span> {profileData.city}</p>}
            {profileData?.country && <p><span className="text-muted-foreground">Country:</span> {profileData.country}</p>}
            {profileData?.goals && <p><span className="text-muted-foreground">Goals:</span> {profileData.goals}</p>}
            {profileData?.interests && <p><span className="text-muted-foreground">Interests:</span> {profileData.interests}</p>}
            {!profileData?.phone && !profileData?.age && !profileData?.goals && <p className="text-muted-foreground">No details added yet</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Education</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profileData?.institution && <p><span className="text-muted-foreground">Institution:</span> {profileData.institution}</p>}
            {profileData?.educationLevel && <p><span className="text-muted-foreground">Level:</span> {profileData.educationLevel}</p>}
            {profileData?.exam && <p><span className="text-muted-foreground">Exam:</span> {profileData.exam}</p>}
            {profileData?.studyMode && <p><span className="text-muted-foreground">Study Mode:</span> {profileData.studyMode}</p>}
            {!profileData?.institution && <p className="text-muted-foreground">No education info</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{s.totalSessions ?? 0}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{fmtDuration(s.totalTimeSpent)}</p>
            <p className="text-xs text-muted-foreground">Time Practiced</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{s.drawingsCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Drawings</p>
          </CardContent>
        </Card>
      </div>

      {s.achievements?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Achievements</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {s.achievements.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-4 py-2">
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Practice Breakdown</CardTitle></CardHeader>
        <CardContent>
          {s.categoryBreakdown?.length > 0 ? (
            <div className="space-y-4">
              {s.categoryBreakdown.map((c: any) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.category}</span>
                    <span className="text-muted-foreground">{c.sessions} sessions</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${Math.min((c.sessions / Math.max(s.totalSessions, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No practice history yet</p>}
        </CardContent>
      </Card>
    </div>
  )
}
