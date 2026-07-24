import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const challenge = await prisma.challenge.findUnique({
      where: { id },
    })
    if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const participantCount = await prisma.challengeParticipant.count({ where: { challengeId: id } })
    const participants = await prisma.challengeParticipant.findMany({
      where: { challengeId: id },
      orderBy: [{ score: "desc" }, { completedAt: "asc" }],
    })
    const participantsWithUser = await Promise.all((participants as any[]).map(async (p) => {
      const user = await prisma.user.findUnique({ where: { id: p.userId }, select: "id, name, avatarUrl" })
      return { ...p, user }
    }))

    return NextResponse.json({ challenge: { ...challenge, _count: { participants: participantCount }, participants: participantsWithUser } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
