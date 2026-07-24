"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => {})
  }, [])

  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin"
    await fetch("/api/admin/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage user roles and access</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b border-border">
                    <td className="p-4">{user.name || "—"}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="outline" onClick={() => toggleRole(user.id, user.role)}>
                        Make {user.role === "admin" ? "User" : "Admin"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
