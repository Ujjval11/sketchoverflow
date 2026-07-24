import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"
import { XP_PER_SESSION } from "@/lib/utils/constants"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { sessions } = await request.json()
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "No sessions" }, { status: 400 })
    }

    const data = sessions.map((s: any) => ({
      userId: user.id,
      referenceId: s.referenceId,
      duration: s.duration,
    }))

    await prisma.practiceSession.createMany({ data })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: sessions.length * XP_PER_SESSION },
        streak: { increment: 1 },
        lastPracticeDate: new Date(),
      },
    })

    return NextResponse.json({ success: true, count: data.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
