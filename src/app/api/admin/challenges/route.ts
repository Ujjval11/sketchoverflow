import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma/db"

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const db = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!db || db.role !== "admin") return null
  return user
}

export async function GET(request: Request) {
  try {
    const admin = await checkAdmin()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const challenge = await prisma.challenge.findUnique({
        where: { id },
        include: {
          participants: {
            include: { user: { select: { name: true, email: true, avatarUrl: true } } },
            orderBy: { score: "desc" },
          },
          reference: true,
        },
      })
      if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json({ challenge })
    }

    const challenges = await prisma.challenge.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { participants: true } } },
    })
    return NextResponse.json({ challenges })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string
    const type = formData.get("type") as string
    const description = formData.get("description") as string
    const difficulty = formData.get("difficulty") as string | null
    const duration = formData.get("duration") ? Number(formData.get("duration")) : null
    const rewardTitle = formData.get("rewardTitle") as string | null
    const rewardXP = formData.get("rewardXP") ? Number(formData.get("rewardXP")) : 50
    const rewardCoins = formData.get("rewardCoins") ? Number(formData.get("rewardCoins")) : 10
    const isActive = formData.get("isActive") !== "false"
    const sortOrder = formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0
    const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : new Date()
    const endDate = formData.get("endDate") ? new Date(formData.get("endDate") as string) : new Date(Date.now() + 7 * 86400000)

    if (!title || !type) return NextResponse.json({ error: "Title and type required" }, { status: 400 })

    let imageUrl: string | null = null
    if (file) {
      const { data: bucket } = await supabaseAdmin.storage.getBucket("challenges")
      if (!bucket) {
        await supabaseAdmin.storage.createBucket("challenges", { public: true, fileSizeLimit: 10485760 })
      }
      const ext = file.name.split(".").pop() || "png"
      const fileName = `challenges/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const bytes = await file.arrayBuffer()
      const { error: uploadError } = await supabaseAdmin.storage.from("challenges").upload(fileName, bytes, { contentType: file.type })
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
      const { data: urlData } = supabaseAdmin.storage.from("challenges").getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    const challenge = await prisma.challenge.create({
      data: { title, type, description, imageUrl, difficulty, duration, rewardTitle, rewardXP, rewardCoins, isActive, sortOrder, startDate, endDate },
    })
    return NextResponse.json({ challenge }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const formData = await request.formData()
    const id = formData.get("id") as string
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const file = formData.get("file") as File | null
    const data: Record<string, any> = {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      difficulty: formData.get("difficulty") as string || null,
      duration: formData.get("duration") ? Number(formData.get("duration")) : null,
      rewardTitle: formData.get("rewardTitle") as string || null,
      rewardXP: formData.get("rewardXP") ? Number(formData.get("rewardXP")) : 50,
      rewardCoins: formData.get("rewardCoins") ? Number(formData.get("rewardCoins")) : 10,
      isActive: formData.get("isActive") !== "false",
      sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : undefined,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : undefined,
    }

    if (file) {
      const { data: bucket } = await supabaseAdmin.storage.getBucket("challenges")
      if (!bucket) {
        await supabaseAdmin.storage.createBucket("challenges", { public: true, fileSizeLimit: 10485760 })
      }
      const ext = file.name.split(".").pop() || "png"
      const fileName = `challenges/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const bytes = await file.arrayBuffer()
      const { error: uploadError } = await supabaseAdmin.storage.from("challenges").upload(fileName, bytes, { contentType: file.type })
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
      const { data: urlData } = supabaseAdmin.storage.from("challenges").getPublicUrl(fileName)
      data.imageUrl = urlData.publicUrl
    }

    const challenge = await prisma.challenge.update({ where: { id }, data })
    return NextResponse.json({ challenge })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.challenge.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
