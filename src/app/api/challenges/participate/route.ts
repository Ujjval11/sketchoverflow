import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"
import { XP_DAILY_CHALLENGE } from "@/lib/utils/constants"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { challengeId } = await request.json()
    if (!challengeId) return NextResponse.json({ error: "Missing challengeId" }, { status: 400 })

    const existing = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId: user.id } },
    })
    if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 })

    const participant = await prisma.challengeParticipant.create({
      data: { challengeId, userId: user.id },
    })
    return NextResponse.json({ participant }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { challengeId, score } = await request.json()
    if (!challengeId || score === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 })

    const participant = await prisma.challengeParticipant.upsert({
      where: { challengeId_userId: { challengeId, userId: user.id } },
      update: { score, completedAt: new Date() },
      create: { challengeId, userId: user.id, score, completedAt: new Date() },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: challenge.rewardXP },
        coins: { increment: challenge.rewardCoins },
      },
    })

    return NextResponse.json({ participant, rewardXP: challenge.rewardXP, rewardCoins: challenge.rewardCoins })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
