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
      include: { reference: { include: { category: true } } },
    })
    return NextResponse.json({ sessions })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
