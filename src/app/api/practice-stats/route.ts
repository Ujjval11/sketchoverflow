import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"
import { getXPProgress } from "@/lib/utils/constants"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [dbUser, totalSessions, allSessions, drawingsCount, uaRaw] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { xp: true, level: true, streak: true, coins: true },
      }),
      prisma.practiceSession.count({ where: { userId: user.id } }),
      prisma.practiceSession.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
      prisma.drawingSubmission.count({ where: { userId: user.id } }),
      prisma.userAchievement.findMany({ where: { userId: user.id } }),
    ])

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const totalTimeSpent = allSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)

    const catCache: Record<string, string> = {}
    async function getCatName(refId: string): Promise<string> {
      if (catCache[refId]) return catCache[refId]
      const ref = await prisma.referenceImage.findUnique({ where: { id: refId }, select: { categoryId: true } })
      if (ref) {
        if (!catCache[ref.categoryId]) {
          const cat = await prisma.category.findUnique({ where: { id: ref.categoryId }, select: { name: true } })
          catCache[ref.categoryId] = cat?.name || "Unknown"
        }
        catCache[refId] = catCache[ref.categoryId]
        return catCache[refId]
      }
      return "Unknown"
    }

    const recentSessions = await Promise.all(allSessions.map(async (s: any) => ({
      id: s.id,
      duration: s.duration,
      completedAt: s.completedAt,
      isSkipped: s.isSkipped,
      category: s.referenceId ? await getCatName(s.referenceId) : "Unknown",
    })))

    const sessionsByCategory: Record<string, number> = {}
    const allSessionsWithRefs = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      select: { referenceId: true, duration: true },
    })
    for (const s of allSessionsWithRefs) {
      if (s.referenceId) {
        const name = await getCatName(s.referenceId)
        sessionsByCategory[name] = (sessionsByCategory[name] || 0) + 1
      }
    }

    const achievements = (await Promise.all(uaRaw.map(async (ua: any) => {
      const ach = await prisma.achievement.findUnique({ where: { id: ua.achievementId } })
      return ach ? { id: ach.id, name: ach.name, description: ach.description, icon: ach.icon, unlockedAt: ua.unlockedAt } : null
    }))).filter(Boolean)

    return NextResponse.json({
      totalXP: dbUser.xp,
      level: dbUser.level,
      streak: dbUser.streak,
      coins: dbUser.coins,
      totalSessions,
      totalTimeSpent,
      drawingsCount,
      categoriesAccessed: Object.keys(sessionsByCategory).length,
      xpProgress: getXPProgress(dbUser.xp),
      recentSessions,
      categoryBreakdown: Object.entries(sessionsByCategory).map(([category, sessions]) => ({ category, sessions })),
      achievements,
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
