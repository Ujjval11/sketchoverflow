"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function ProgressPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/practice-stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Progress</h1>
        <p className="text-muted-foreground mt-1">Track your improvement over time</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 text-center">
          <p className="text-3xl font-bold">{stats?.totalSessions || 0}</p>
          <p className="text-sm text-muted-foreground">Total Sessions</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-3xl font-bold">{stats?.totalXP || 0}</p>
          <p className="text-sm text-muted-foreground">Total XP</p>
        </CardContent></Card>
        <Card><CardContent className="p-6 text-center">
          <p className="text-3xl font-bold">{stats?.streak || 0}</p>
          <p className="text-sm text-muted-foreground">Day Streak</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
        <CardContent>
          {stats?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.categoryBreakdown.map((c: any) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.category}</span>
                    <span className="text-muted-foreground">{c.sessions} sessions</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((c.sessions / (stats.totalSessions || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No data yet</p>}
        </CardContent>
      </Card>
    </div>
  )
}
