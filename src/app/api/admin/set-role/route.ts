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

export async function POST(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { userId, role } = await request.json()
    if (!userId || !role) return NextResponse.json({ error: "Missing userId or role" }, { status: 400 })
    if (!["user", "admin"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 })

    await prisma.user.update({ where: { id: userId }, data: { role } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
