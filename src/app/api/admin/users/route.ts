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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, xp: true, createdAt: true },
  })
  return NextResponse.json({ users })
}
