import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"
import { getLevel, getXPProgress } from "@/lib/utils/constants"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true, level: true, streak: true, coins: true },
    })
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const totalSessions = await prisma.practiceSession.count({ where: { userId: user.id } })

    const recentSessionsRaw = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
      take: 10,
    })
    const recentSessions = await Promise.all(recentSessionsRaw.map(async (s: any) => {
      let categoryName = "Unknown"
      if (s.referenceId) {
        const ref = await prisma.referenceImage.findUnique({ where: { id: s.referenceId }, select: { categoryId: true } })
        if (ref) {
          const cat = await prisma.category.findUnique({ where: { id: ref.categoryId }, select: { name: true } })
          if (cat) categoryName = cat.name
        }
      }
      return {
        id: s.id,
        duration: s.duration,
        completedAt: s.completedAt,
        isSkipped: s.isSkipped,
        category: categoryName,
      }
    }))

    const allSessions = await prisma.practiceSession.findMany({
      where: { userId: user.id },
    })
    const sessionsByCategory: Record<string, number> = {}
    for (const s of allSessions) {
      if (s.referenceId) {
        const ref = await prisma.referenceImage.findUnique({ where: { id: s.referenceId }, select: { categoryId: true } })
        if (ref) {
          const cat = await prisma.category.findUnique({ where: { id: ref.categoryId }, select: { name: true } })
          if (cat) {
            sessionsByCategory[cat.name] = (sessionsByCategory[cat.name] || 0) + 1
          }
        }
      }
    }

    const uaRaw = await prisma.userAchievement.findMany({
      where: { userId: user.id },
    })
    const achievements = await Promise.all(uaRaw.map(async (ua: any) => {
      const ach = await prisma.achievement.findUnique({ where: { id: ua.achievementId } })
      return ach ? { id: ach.id, name: ach.name, description: ach.description, icon: ach.icon, unlockedAt: ua.unlockedAt } : null
    }))

    return NextResponse.json({
      totalXP: dbUser.xp,
      level: dbUser.level,
      streak: dbUser.streak,
      totalSessions,
      xpProgress: getXPProgress(dbUser.xp),
      recentSessions,
      categoryBreakdown: Object.entries(sessionsByCategory).map(([category, sessions]) => ({ category, sessions })),
      achievements: achievements.filter(Boolean),
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
