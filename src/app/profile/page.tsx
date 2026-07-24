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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar src={userData.avatarUrl} name={userData.name || userData.email} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">{userData.name || "User"}</h1>
            <p className="text-muted-foreground">{userData.email}</p>
            {profileData?.bio && <p className="text-sm mt-2">{profileData.bio}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {profileData?.phone && <p><span className="text-muted-foreground">Phone:</span> {profileData.phone}</p>}
            {profileData?.age && <p><span className="text-muted-foreground">Age:</span> {profileData.age}</p>}
            {profileData?.city && <p><span className="text-muted-foreground">City:</span> {profileData.city}</p>}
            {profileData?.country && <p><span className="text-muted-foreground">Country:</span> {profileData.country}</p>}
            {!profileData?.phone && !profileData?.age && <p className="text-muted-foreground">No info added yet</p>}
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

      <Card>
        <CardHeader><CardTitle>Practice History</CardTitle></CardHeader>
        <CardContent>
          {stats?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryBreakdown.map((c: any) => (
                <div key={c.category} className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-medium">{c.category}</span>
                  <span className="text-sm text-muted-foreground">{c.sessions} sessions</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No practice history yet</p>}
        </CardContent>
      </Card>
    </div>
  )
}
