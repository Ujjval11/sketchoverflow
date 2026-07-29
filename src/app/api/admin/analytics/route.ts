import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const db = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!db || db.role !== "admin") return null
  return user
}

export async function GET() {
  try {
    const admin = await checkAdmin()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 29)

    const [
      totalUsers, activeUsers, totalImages, totalSessions,
      sessionsToday, sessionsWeek, sessionsMonth,
      allUsers, allSessions, allImages, allCategories,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLogin: { gte: weekAgo } } }),
      prisma.referenceImage.count(),
      prisma.practiceSession.count(),
      prisma.practiceSession.count({ where: { completedAt: { gte: today } } }),
      prisma.practiceSession.count({ where: { completedAt: { gte: weekAgo } } }),
      prisma.practiceSession.count({ where: { completedAt: { gte: monthAgo } } }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.practiceSession.findMany({ orderBy: { completedAt: "desc" } }),
      prisma.referenceImage.findMany(),
      prisma.category.findMany(),
    ])

    const catMap = new Map(allCategories.map((c: any) => [c.id, c.name]))

    const imageCountByCat: Record<string, number> = {}
    const imageCountByDiff: Record<string, number> = {}
    for (const img of allImages) {
      imageCountByCat[img.categoryId] = (imageCountByCat[img.categoryId] || 0) + 1
      imageCountByDiff[img.difficulty] = (imageCountByDiff[img.difficulty] || 0) + 1
    }

    const sessionCountByCat: Record<string, number> = {}
    const sessionCountByDiff: Record<string, number> = {}
    const sessionCountByDay: Record<string, number> = {}
    for (const s of allSessions) {
      const day = s.completedAt?.slice(0, 10)
      if (day) sessionCountByDay[day] = (sessionCountByDay[day] || 0) + 1
    }

    const imagesPerCategory = allCategories.map((c: any) => ({
      name: catMap.get(c.id) || c.name,
      images: imageCountByCat[c.id] || 0,
      sessions: sessionCountByCat[c.id] || 0,
    }))

    const difficultyLabels: Record<string, string> = { BEGINNER: "Starter", INTERMEDIATE: "Intermediate", ADVANCED: "Pro" }
    const imagesPerDifficulty = Object.entries(imageCountByDiff).map(([k, v]) => ({
      difficulty: difficultyLabels[k] || k,
      images: v,
    }))

    const sessionsPerDay = Object.entries(sessionCountByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, count]) => ({ date, count }))

    const totalPracticeTime = allSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
    const avgSessionDuration = totalSessions > 0 ? Math.round(totalPracticeTime / totalSessions) : 0
    const skippedSessions = allSessions.filter((s: any) => s.isSkipped).length

    const userCounts = { total: totalUsers, active7d: activeUsers }
    const sessionCounts = { total: totalSessions, today: sessionsToday, week: sessionsWeek, month: sessionsMonth }
    const imageCounts = { total: totalImages }
    const timeStats = { totalSeconds: totalPracticeTime, avgSeconds: avgSessionDuration, skipped: skippedSessions }

    return NextResponse.json({
      userCounts,
      sessionCounts,
      imageCounts,
      timeStats,
      imagesPerCategory,
      imagesPerDifficulty,
      sessionsPerDay,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}
