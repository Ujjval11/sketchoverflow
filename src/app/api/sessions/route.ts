import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sessions = await prisma.practiceSession.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
      take: 50,
    })
    const enriched = await Promise.all(sessions.map(async (s: any) => {
      let category = null
      if (s.referenceId) {
        const ref = await prisma.referenceImage.findUnique({ where: { id: s.referenceId }, select: "categoryId" })
        if (ref) category = await prisma.category.findUnique({ where: { id: ref.categoryId } })
      }
      return { ...s, reference: s.referenceId ? { category } : null }
    }))
    return NextResponse.json({ sessions: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
