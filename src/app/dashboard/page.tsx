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

  function fmtDuration(seconds: number): string {
    if (!seconds) return "0m"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  if (!user) return null

  const s = stats || {}
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const today = new Date().getDay()
  const weekDays = days.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (today - i + 7) % 7)
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user.name || user.email}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-b from-primary/5 to-transparent"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{s.totalXP ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-b from-indigo-500/5 to-transparent"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{s.level ?? 1}</p>
          <p className="text-xs text-muted-foreground">Level</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-b from-amber-500/5 to-transparent"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{s.coins ?? 0}</p>
          <p className="text-xs text-muted-foreground">Coins</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-b from-green-500/5 to-transparent"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{s.streak ?? 0}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold">{s.totalSessions ?? 0}</p>
          <p className="text-xs text-muted-foreground">Sessions</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold">{fmtDuration(s.totalTimeSpent)}</p>
          <p className="text-xs text-muted-foreground">Time Spent</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold">{s.drawingsCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">Drawings</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xl font-bold">{s.categoriesAccessed ?? 0}</p>
          <p className="text-xs text-muted-foreground">Categories</p>
        </CardContent></Card>
      </div>

      {s.xpProgress && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level {s.level} Progress</span>
              <span className="text-xs text-muted-foreground">{s.xpProgress.current} / {s.xpProgress.needed} XP</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${s.xpProgress.progress * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {s.sessionsPerDay?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">This Week</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24">
              {weekDays.map((day) => {
                const count = s.sessionsPerDay.find((d: any) => d.date === day)?.count || 0
                const max = Math.max(...s.sessionsPerDay.map((d: any) => d.count), 1)
                const pct = (count / max) * 100
                const label = days[new Date(day).getDay()]
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-muted-foreground font-mono">{count}</span>
                    <div className="w-full bg-primary/20 rounded-t" style={{ height: `${Math.max(pct, 1)}%` }}>
                      <div className="h-full w-full bg-primary/60 rounded-t" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {s.difficultyBreakdown?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Difficulty Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {s.difficultyBreakdown.map((d: any) => (
                <div key={d.difficulty} className="flex-1 text-center rounded-lg bg-muted/30 p-3">
                  <div className={`h-2 rounded-full mb-2 ${d.color}`} style={{ opacity: 0.6 }} />
                  <p className="text-lg font-bold">{d.count}</p>
                  <p className="text-xs text-muted-foreground">{d.difficulty}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {s.categoryBreakdown?.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Categories Practiced</h2>
          <div className="flex flex-wrap gap-2">
            {s.categoryBreakdown.map((c: any) => (
              <span key={c.category} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-1.5 text-sm font-medium">
                {c.category}
                <span className="inline-flex items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-bold">{c.sessions}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
        <div className="space-y-2">
          {s.recentSessions?.length > 0 ? s.recentSessions.map((sess: any) => (
            <Card key={sess.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{sess.category}</p>
                  <p className="text-sm text-muted-foreground">
                    {sess.duration}s · {new Date(sess.completedAt).toLocaleDateString()}
                    {sess.difficulty && <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${sess.difficulty === "BEGINNER" ? "bg-green-500/10 text-green-600" : sess.difficulty === "INTERMEDIATE" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"}`}>{sess.difficulty === "BEGINNER" ? "Starter" : sess.difficulty === "INTERMEDIATE" ? "Intermediate" : "Pro"}</span>}
                  </p>
                </div>
                <span className={`text-sm font-medium ${sess.isSkipped ? "text-muted-foreground" : "text-green-600"}`}>{sess.isSkipped ? "Skipped" : "Completed"}</span>
              </CardContent>
            </Card>
          )) : <p className="text-sm text-muted-foreground">No sessions yet. Start practicing!</p>}
        </div>
      </div>

      {s.achievements?.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {s.achievements.map((a: any) => (
              <Card key={a.id} className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
