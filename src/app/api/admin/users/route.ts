import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
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

    const [users, profiles, allSessions, allRefs, allCats] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.profile.findMany(),
      prisma.practiceSession.findMany(),
      prisma.referenceImage.findMany(),
      prisma.category.findMany(),
    ])

    const profileMap = new Map(profiles.map((p: any) => [p.userId, p]))
    const refMap = new Map(allRefs.map((r: any) => [r.id, r]))
    const catMap = new Map(allCats.map((c: any) => [c.id, c.name]))

    const sessionByUser = new Map<string, any[]>()
    for (const s of allSessions) {
      const list = sessionByUser.get(s.userId) || []
      list.push(s)
      sessionByUser.set(s.userId, list)
    }

    const enriched = users.map((u: any) => {
      const sessions = sessionByUser.get(u.id) || []
      const totalSessions = sessions.length
      const totalTimeSpent = sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
      const uniqueRefIds = [...new Set(sessions.map((s: any) => s.referenceId))]
      const imagesWorked = uniqueRefIds.length

      const categoryIds = [...new Set(uniqueRefIds.map((rid: string) => refMap.get(rid)?.categoryId).filter(Boolean))]
      const categoriesPracticed = [...new Set(categoryIds.map((cid: string) => catMap.get(cid)).filter(Boolean))].join(", ")

      const profile = profileMap.get(u.id)
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        xp: u.xp,
        level: u.level,
        coins: u.coins,
        streak: u.streak,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        profile: profile ? {
          bio: profile.bio, age: profile.age, exam: profile.exam,
          studyMode: profile.studyMode, city: profile.city, country: profile.country,
          educationLevel: profile.educationLevel, goals: profile.goals,
          institution: profile.institution, interests: profile.interests, phone: profile.phone,
        } : null,
        totalSessions,
        totalTimeSpent,
        imagesWorked,
        categoriesPracticed,
      }
    })

    return NextResponse.json({ users: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}
