"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/practice-stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  if (!user) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user.name || user.email}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Total XP</p>
          <p className="text-3xl font-bold">{stats?.totalXP || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="text-3xl font-bold">{stats?.level || 1}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Sessions</p>
          <p className="text-3xl font-bold">{stats?.totalSessions || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Streak</p>
          <p className="text-3xl font-bold">{stats?.streak || 0} days</p>
        </CardContent></Card>
      </div>

      {stats?.xpProgress && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level {stats.level} Progress</span>
              <span className="text-sm text-muted-foreground">{stats.xpProgress.current} / {stats.xpProgress.needed} XP</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.xpProgress.progress * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
        <div className="space-y-2">
          {stats?.recentSessions?.length > 0 ? stats.recentSessions.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.category}</p>
                  <p className="text-sm text-muted-foreground">{s.duration}s · {new Date(s.completedAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-medium">{s.isSkipped ? "Skipped" : "Completed"}</span>
              </CardContent>
            </Card>
          )) : <p className="text-sm text-muted-foreground">No sessions yet. Start practicing!</p>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats?.achievements?.length > 0 ? stats.achievements.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </CardContent>
            </Card>
          )) : <p className="text-sm text-muted-foreground col-span-full">No achievements yet</p>}
        </div>
      </div>
    </div>
  )
}
