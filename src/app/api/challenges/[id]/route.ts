import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
        participants: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: [{ score: "desc" }, { completedAt: "asc" }],
        },
      },
    })
    if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ challenge })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
