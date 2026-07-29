import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"
import { getXPProgress } from "@/lib/utils/constants"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [dbUser, allUserSessions, drawingsCount, uaRaw, allRefs, allCats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { xp: true, level: true, streak: true, coins: true, name: true, email: true, avatarUrl: true, createdAt: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
      }),
      prisma.drawingSubmission.count({ where: { userId: user.id } }),
      prisma.userAchievement.findMany({ where: { userId: user.id } }),
      prisma.referenceImage.findMany(),
      prisma.category.findMany(),
    ])

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const refMap = new Map(allRefs.map((r: any) => [r.id, r]))
    const catMap = new Map(allCats.map((c: any) => [c.id, c.name]))

    function getCatName(refId: string): string {
      const ref = refMap.get(refId)
      return ref ? catMap.get(ref.categoryId) || "Unknown" : "Unknown"
    }

    const recentSessions = allUserSessions.slice(0, 10).map((s: any) => ({
      id: s.id,
      duration: s.duration,
      completedAt: s.completedAt,
      isSkipped: s.isSkipped,
      difficulty: refMap.get(s.referenceId)?.difficulty || null,
      category: getCatName(s.referenceId),
    }))

    const totalTimeSpent = allUserSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
    const totalSessions = allUserSessions.length
    const completedSessions = allUserSessions.filter((s: any) => !s.isSkipped).length

    const sessionsByCategory: Record<string, number> = {}
    const sessionsByDifficulty: Record<string, number> = {}
    const sessionsByDay: Record<string, number> = {}
    for (const s of allUserSessions) {
      const name = getCatName(s.referenceId)
      sessionsByCategory[name] = (sessionsByCategory[name] || 0) + 1
      const diff = refMap.get(s.referenceId)?.difficulty || "UNKNOWN"
      sessionsByDifficulty[diff] = (sessionsByDifficulty[diff] || 0) + 1
      const day = s.completedAt?.slice(0, 10)
      if (day) sessionsByDay[day] = (sessionsByDay[day] || 0) + 1
    }

    const difficultyLabels: Record<string, string> = { BEGINNER: "Starter", INTERMEDIATE: "Intermediate", ADVANCED: "Pro" }
    const difficultyColors: Record<string, string> = { BEGINNER: "bg-green-500", INTERMEDIATE: "bg-amber-500", ADVANCED: "bg-red-500" }

    const achievements = (await Promise.all(uaRaw.map(async (ua: any) => {
      const ach = await prisma.achievement.findUnique({ where: { id: ua.achievementId } })
      return ach ? { id: ach.id, name: ach.name, description: ach.description, icon: ach.icon, unlockedAt: ua.unlockedAt } : null
    }))).filter(Boolean)

    return NextResponse.json({
      user: { name: dbUser.name, email: dbUser.email, avatarUrl: dbUser.avatarUrl, joinedAt: dbUser.createdAt },
      totalXP: dbUser.xp,
      level: dbUser.level,
      streak: dbUser.streak,
      coins: dbUser.coins,
      totalSessions,
      completedSessions,
      totalTimeSpent,
      drawingsCount,
      categoriesAccessed: Object.keys(sessionsByCategory).length,
      xpProgress: getXPProgress(dbUser.xp),
      recentSessions,
      categoryBreakdown: Object.entries(sessionsByCategory).map(([category, sessions]) => ({ category, sessions })),
      difficultyBreakdown: Object.entries(sessionsByDifficulty).map(([diff, count]) => ({
        difficulty: difficultyLabels[diff] || diff,
        count,
        color: difficultyColors[diff] || "bg-gray-500",
      })),
      sessionsPerDay: Object.entries(sessionsByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, count]) => ({ date, count })),
      achievements,
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
