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
      include: {
        _count: { select: { practiceSessions: true } },
        practiceSessions: {
          orderBy: { completedAt: "desc" },
          take: 10,
          include: { reference: { select: { category: { select: { name: true } } } } },
        },
        achievements: { include: { achievement: true } },
      },
    })

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const sessionsByCategory: Record<string, number> = {}
    const allSessions = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      include: { reference: { select: { category: { select: { name: true } } } } },
    })
    for (const s of allSessions) {
      const name = s.reference.category.name
      sessionsByCategory[name] = (sessionsByCategory[name] || 0) + 1
    }

    return NextResponse.json({
      totalXP: dbUser.xp,
      level: dbUser.level,
      streak: dbUser.streak,
      totalSessions: dbUser._count.practiceSessions,
      xpProgress: getXPProgress(dbUser.xp),
      recentSessions: dbUser.practiceSessions.map((s) => ({
        id: s.id,
        duration: s.duration,
        completedAt: s.completedAt,
        isSkipped: s.isSkipped,
        category: s.reference.category.name,
      })),
      categoryBreakdown: Object.entries(sessionsByCategory).map(([category, sessions]) => ({ category, sessions })),
      achievements: dbUser.achievements.map((ua) => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
