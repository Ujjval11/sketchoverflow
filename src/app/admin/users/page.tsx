"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/users")
      const d = await r.json()
      setUsers(d.users || [])
    } catch {}
    setLoading(false)
  }

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin"
    await fetch("/api/admin/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  async function userAction(userId: string, action: string) {
    if (action === "delete" && !confirm("Delete this user permanently? This cannot be undone.")) return
    await fetch("/api/admin/user-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    })
    loadUsers()
  }

  function fmt(iso?: string) {
    if (!iso) return "—"
    return new Date(iso).toLocaleString()
  }

  function fmtDuration(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">{users.length} users</p>
      </div>

      <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm" />

      <div className="space-y-4">
        {users.filter((u) => {
          if (!search.trim()) return true
          const q = search.toLowerCase()
          return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
        }).map((user: any) => {
          const isOpen = expanded.has(user.id)
          const p = user.profile || {}
          return (
            <Card key={user.id}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setExpanded(prev => { const n = new Set(prev); isOpen ? n.delete(user.id) : n.add(user.id); return n })}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{user.name || "—"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{user.role}</span>
                        {user.banned && <span className="text-xs px-2 py-0.5 rounded bg-error/10 text-error">Disabled</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleRole(user.id, user.role)}>
                      {user.role === "admin" ? "Demote" : "Make Admin"}
                    </Button>
                    {!user.banned ? (
                      <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => userAction(user.id, "ban")}>
                        Disable
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => userAction(user.id, "unban")}>
                        Enable
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-error border-error/30 hover:bg-error/5" onClick={() => userAction(user.id, "delete")}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent className="border-t border-border pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-lg font-bold">{user.level ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">XP</p>
                      <p className="text-lg font-bold">{user.xp ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Coins</p>
                      <p className="text-lg font-bold">{user.coins ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Streak</p>
                      <p className="text-lg font-bold">{user.streak ?? 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Sessions</p>
                      <p className="text-lg font-bold">{user.totalSessions ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Total Practice Time</p>
                      <p className="text-lg font-bold">{fmtDuration(user.totalTimeSpent ?? 0)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Images Worked</p>
                      <p className="text-lg font-bold">{user.imagesWorked ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Categories</p>
                      <p className="text-lg font-bold truncate" title={user.categoriesPracticed}>{user.categoriesPracticed || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-semibold">Account</p>
                      <p className="text-xs"><span className="text-muted-foreground">Joined:</span> {fmt(user.createdAt)}</p>
                      <p className="text-xs"><span className="text-muted-foreground">Last Login:</span> {fmt(user.lastLogin)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-semibold">Personal</p>
                      {p.bio && <p className="text-xs"><span className="text-muted-foreground">Bio:</span> {p.bio}</p>}
                      {p.age && <p className="text-xs"><span className="text-muted-foreground">Age:</span> {p.age}</p>}
                      {p.city && p.country && <p className="text-xs"><span className="text-muted-foreground">Location:</span> {p.city}, {p.country}</p>}
                      {p.phone && <p className="text-xs"><span className="text-muted-foreground">Phone:</span> {p.phone}</p>}
                      {!p.bio && !p.age && !p.city && <p className="text-xs text-muted-foreground">No details provided</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-semibold">Education</p>
                      {p.educationLevel && <p className="text-xs"><span className="text-muted-foreground">Level:</span> {p.educationLevel}</p>}
                      {p.institution && <p className="text-xs"><span className="text-muted-foreground">Institution:</span> {p.institution}</p>}
                      {p.exam && <p className="text-xs"><span className="text-muted-foreground">Exam:</span> {p.exam}</p>}
                      {p.studyMode && <p className="text-xs"><span className="text-muted-foreground">Study Mode:</span> {p.studyMode}</p>}
                      {!p.educationLevel && <p className="text-xs text-muted-foreground">No education details</p>}
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-semibold">Interests & Goals</p>
                      {p.goals && <p className="text-xs"><span className="text-muted-foreground">Goals:</span> {p.goals}</p>}
                      {p.interests && <p className="text-xs"><span className="text-muted-foreground">Interests:</span> {p.interests}</p>}
                      {!p.goals && !p.interests && <p className="text-xs text-muted-foreground">No goals or interests</p>}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
