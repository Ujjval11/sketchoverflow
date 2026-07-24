import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    })
    const enriched = await Promise.all((challenges as any[]).map(async (c) => {
      const participantCount = await prisma.challengeParticipant.count({ where: { challengeId: c.id } })
      const topParticipants = await prisma.challengeParticipant.findMany({
        where: { challengeId: c.id },
        orderBy: { score: "desc" },
        take: 10,
      })
      const participantsWithUser = await Promise.all((topParticipants as any[]).map(async (p) => {
        const user = await prisma.user.findUnique({ where: { id: p.userId }, select: "name, avatarUrl" })
        return { ...p, user }
      }))
      return {
        ...c,
        _count: { participants: participantCount },
        participants: participantsWithUser,
      }
    }))
    return NextResponse.json({ challenges: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
