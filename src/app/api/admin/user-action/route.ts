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

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { action, userId } = await request.json()
    if (!action || !userId) return NextResponse.json({ error: "Missing action or userId" }, { status: 400 })

    if (action === "ban") {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "43800h" })
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
      await prisma.user.update({ where: { id: userId }, data: { banned: true } })
      return NextResponse.json({ success: true })
    }

    if (action === "unban") {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: "none" })
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
      await prisma.user.update({ where: { id: userId }, data: { banned: false } })
      return NextResponse.json({ success: true })
    }

    if (action === "delete") {
      await prisma.$transaction([
        prisma.practiceSession.deleteMany({ where: { userId } }),
        prisma.drawingSubmission.deleteMany({ where: { userId } }),
        prisma.bookmark.deleteMany({ where: { referenceId: userId } }),
        prisma.userAchievement.deleteMany({ where: { userId } }),
        prisma.profile.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ])
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
