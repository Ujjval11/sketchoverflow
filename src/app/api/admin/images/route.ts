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
    const categoryId = searchParams.get("categoryId")
    const where = categoryId ? { categoryId } : {}
    const images = await prisma.referenceImage.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      take: 200,
    })
    const enriched = await Promise.all((images as any[]).map(async (img) => {
      const category = await prisma.category.findUnique({ where: { id: img.categoryId } })
      return { ...img, category }
    }))
    return NextResponse.json({ images: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get("file") as File
    const categoryId = formData.get("categoryId") as string
    const isPublished = formData.get("isPublished") === "true"
    const duration = formData.get("duration") ? Number(formData.get("duration")) : null
    const difficulty = formData.get("difficulty") as string | null

    if (!file || !categoryId) return NextResponse.json({ error: "File and category required" }, { status: 400 })

    const { data: bucket } = await supabaseAdmin.storage.getBucket("references")
    if (!bucket) {
      await supabaseAdmin.storage.createBucket("references", { public: true, fileSizeLimit: 10485760 })
    }

    const ext = file.name.split(".").pop() || "png"
    const fileName = `references/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage.from("references").upload(fileName, bytes, { contentType: file.type })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabaseAdmin.storage.from("references").getPublicUrl(fileName)
    const url = urlData.publicUrl

    const image = await prisma.referenceImage.create({
      data: { url, categoryId, isPublished, duration, difficulty },
    })
    await prisma.category.update({ where: { id: categoryId }, data: { imageCount: { increment: 1 } } })

    return NextResponse.json({ image }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id, isPublished } = await request.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const image = await prisma.referenceImage.update({ where: { id }, data: { isPublished } })
    return NextResponse.json({ image })
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

  try {
    const image = await prisma.referenceImage.findUnique({ where: { id } })
    if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.$transaction([
      prisma.practiceSession.deleteMany({ where: { referenceId: id } }),
      prisma.drawingSubmission.deleteMany({ where: { referenceId: id } }),
      prisma.bookmark.deleteMany({ where: { referenceId: id } }),
      prisma.challenge.deleteMany({ where: { referenceId: id } }),
      prisma.referenceImage.delete({ where: { id } }),
      prisma.category.update({ where: { id: image.categoryId }, data: { imageCount: { decrement: 1 } } }),
    ])

    const pathMatch = image.url.match(/\/references\/(.+)$/)
    if (pathMatch) {
      await supabaseAdmin.storage.from("references").remove([pathMatch[1]]).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Delete failed" }, { status: 500 })
  }
}
