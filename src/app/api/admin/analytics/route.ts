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
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalUsers, todaySessions, totalImages, totalSessions] = await Promise.all([
    prisma.user.count(),
    prisma.practiceSession.count({ where: { completedAt: { gte: today } } }),
    prisma.referenceImage.count(),
    prisma.practiceSession.count(),
  ])

  return NextResponse.json({ totalUsers, todaySessions, totalImages, totalSessions })
}
