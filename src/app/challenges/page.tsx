"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DIFFICULTY_OPTIONS } from "@/lib/utils/constants"
import { useEffect, useState } from "react"

export default function ChallengesPage() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<any[]>([])
  const [userChallenges, setUserChallenges] = useState<Set<string>>(new Set())
  const [participating, setParticipating] = useState<string | null>(null)

  useEffect(() => { loadChallenges() }, [])

  async function loadChallenges() {
    const r = await fetch("/api/challenges")
    const d = await r.json()
    setChallenges(d.challenges || [])
  }

  async function joinChallenge(challengeId: string) {
    if (!user) return
    setParticipating(challengeId)
    try {
      const r = await fetch("/api/challenges/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      })
      if (r.ok) setUserChallenges(prev => new Set(prev).add(challengeId))
      else { const d = await r.json(); alert(d.error || "Failed to join") }
    } catch {}
    setParticipating(null)
  }

  const activeChallenges = challenges.filter((c) => {
    const now = new Date(); return new Date(c.startDate) <= now && new Date(c.endDate) >= now
  })

  const upcomingChallenges = challenges.filter((c) => new Date(c.startDate) > new Date())

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🏆 Challenges</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Push your skills with themed drawing challenges. Complete them to earn XP, coins, and exclusive titles.
        </p>
      </div>

      {activeChallenges.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Active Now</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {activeChallenges.map((c: any) => {
              const isJoined = userChallenges.has(c.id)
              const isJoining = participating === c.id
              const participants = c.participants || []
              return (
                <Card key={c.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {c.imageUrl && (
                      <div className="sm:w-48 h-48 sm:h-auto bg-muted flex-shrink-0">
                        <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-xl font-bold">{c.title}</h3>
                          <span className="text-xs text-muted-foreground capitalize">{c.type} challenge</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                          DIFFICULTY_OPTIONS.find(d => d.value === c.difficulty)?.label === "Starter" ? "bg-success/10 text-success" :
                          DIFFICULTY_OPTIONS.find(d => d.value === c.difficulty)?.label === "Intermediate" ? "bg-yellow-500/10 text-yellow-500" :
                          c.difficulty ? "bg-error/10 text-error" : "bg-muted text-muted-foreground"
                        }`}>
                          {DIFFICULTY_OPTIONS.find(d => d.value === c.difficulty)?.label || "Any Level"}
                        </span>
                      </div>

                      {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {c.duration && <span className="px-2 py-1 rounded bg-muted">{Math.floor(c.duration / 60)}m{c.duration % 60 ? ` ${c.duration % 60}s` : ""}</span>}
                        {c.rewardTitle && <span className="px-2 py-1 rounded bg-primary/5 text-primary">{c.rewardTitle}</span>}
                        <span className="px-2 py-1 rounded bg-primary/5 text-primary">{c.rewardXP} XP</span>
                        <span className="px-2 py-1 rounded bg-yellow-500/5 text-yellow-600">{c.rewardCoins} coins</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">{c._count?.participants || participants.length} artists joined</span>
                        {user ? (
                          isJoined ? <span className="text-sm text-success font-medium">✓ Joined</span>
                          : <Button size="sm" onClick={() => joinChallenge(c.id)} disabled={isJoining}>{isJoining ? "..." : "Join Challenge"}</Button>
                        ) : (
                          <Button size="sm" variant="outline"><a href="/login?redirect=/challenges">Sign in to Join</a></Button>
                        )}
                      </div>

                      {participants.filter((p: any) => p.score != null).length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Leaderboard</p>
                          <div className="space-y-1">
                            {participants.filter((p: any) => p.score != null).slice(0, 5).map((p: any, i: number) => (
                              <div key={p.id} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  <span className="w-4 text-center">{["🥇","🥈","🥉"][i] || `${i+1}.`}</span>
                                  {p.user?.name || "Anonymous"}
                                </span>
                                <span className="font-medium">{p.score} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">🎨</div>
            <p className="text-lg font-medium">No Active Challenges Right Now</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for new creative challenges!</p>
          </CardContent>
        </Card>
      )}

      {challenges.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">🏗️</div>
            <p className="text-lg font-medium">Challenges Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">The admin is setting up exciting drawing challenges for you.</p>
          </CardContent>
        </Card>
      )}

      {upcomingChallenges.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingChallenges.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-bold">{c.title}</h3>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  <div className="text-xs text-muted-foreground">
                    Starts {new Date(c.startDate).toLocaleDateString()} · {c.rewardXP} XP
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
