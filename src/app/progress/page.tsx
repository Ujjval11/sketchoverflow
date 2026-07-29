"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"

export default function ProgressPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/practice-stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  if (!user) return null

  const s = stats || {}

  function fmtDuration(seconds: number): string {
    if (!seconds) return "0m"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const maxSessions = Math.max(...(s.sessionsPerDay || []).map((d: any) => d.count), 1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Progress</h1>
        <p className="text-muted-foreground mt-1">Track your improvement over time</p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">{s.totalSessions ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500/5 to-transparent">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-indigo-600">{s.completedSessions ?? 0}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-amber-600">{s.totalXP ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-transparent">
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{fmtDuration(s.totalTimeSpent)}</p>
            <p className="text-sm text-muted-foreground">Practice Time</p>
          </CardContent>
        </Card>
      </div>

      {s.xpProgress && (
        <Card>
          <CardHeader><CardTitle>Level {s.level} Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.xpProgress.current} XP earned</span>
              <span className="text-sm text-muted-foreground">{s.xpProgress.needed} XP needed</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${s.xpProgress.progress * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">{Math.round(s.xpProgress.progress * 100)}% to next level</p>
          </CardContent>
        </Card>
      )}

      {s.sessionsPerDay?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Sessions (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {s.sessionsPerDay.map((d: any, i: number) => {
                const pct = (d.count / maxSessions) * 100
                const dayLabel = d.date.slice(-5)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                    <span className="text-[9px] text-muted-foreground font-mono">{d.count}</span>
                    <div className="w-full bg-primary/60 rounded-t" style={{ height: `${Math.max(pct, 1)}%` }} />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">{dayLabel}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            {s.categoryBreakdown?.length > 0 ? (
              <div className="space-y-3">
                {s.categoryBreakdown.map((c: any) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.category}</span>
                      <span className="text-muted-foreground">{c.sessions} sessions</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${Math.min((c.sessions / Math.max(s.totalSessions, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>

        {s.difficultyBreakdown?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Difficulty Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {s.difficultyBreakdown.map((d: any) => (
                  <div key={d.difficulty} className="text-center rounded-lg bg-muted/30 p-4">
                    <div className={`h-1.5 rounded-full mb-3 ${d.color}`} style={{ opacity: 0.5 }} />
                    <p className="text-xl font-bold">{d.count}</p>
                    <p className="text-xs text-muted-foreground">{d.difficulty}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {s.achievements?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Achievements</CardTitle></CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
