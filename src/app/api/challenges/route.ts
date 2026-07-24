import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { participants: true } },
        participants: {
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { score: "desc" },
          take: 10,
        },
      },
    })
    return NextResponse.json({ challenges })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
