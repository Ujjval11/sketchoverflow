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

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export async function GET(request: Request) {
  try {
    const admin = await checkAdmin()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const article = await prisma.article.findUnique({
        where: { id },
        include: { author: { select: { name: true, email: true } } },
      })
      if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json({ article })
    }

    const articles = await prisma.article.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { author: { select: { name: true } } },
    })
    return NextResponse.json({ articles })
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
    const slug = (formData.get("slug") as string) || slugify(title)
    const excerpt = formData.get("excerpt") as string | null
    const content = formData.get("content") as string
    const isPublished = formData.get("isPublished") !== "false"
    const sortOrder = formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0

    if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 })

    let imageUrl: string | null = null
    if (file) {
      const { data: bucket } = await supabaseAdmin.storage.getBucket("articles")
      if (!bucket) {
        await supabaseAdmin.storage.createBucket("articles", { public: true, fileSizeLimit: 10485760 })
      }
      const ext = file.name.split(".").pop() || "png"
      const fileName = `articles/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const bytes = await file.arrayBuffer()
      const { error: uploadError } = await supabaseAdmin.storage.from("articles").upload(fileName, bytes, { contentType: file.type })
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
      const { data: urlData } = supabaseAdmin.storage.from("articles").getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    const article = await prisma.article.create({
      data: { title, slug, excerpt, content, imageUrl, authorId: admin.id, isPublished, sortOrder },
    })
    return NextResponse.json({ article }, { status: 201 })
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
    const title = formData.get("title") as string
    const data: Record<string, any> = {
      title,
      slug: (formData.get("slug") as string) || slugify(title),
      excerpt: formData.get("excerpt") as string || null,
      content: formData.get("content") as string,
      isPublished: formData.get("isPublished") !== "false",
      sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
    }

    if (file) {
      const { data: bucket } = await supabaseAdmin.storage.getBucket("articles")
      if (!bucket) {
        await supabaseAdmin.storage.createBucket("articles", { public: true, fileSizeLimit: 10485760 })
      }
      const ext = file.name.split(".").pop() || "png"
      const fileName = `articles/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const bytes = await file.arrayBuffer()
      const { error: uploadError } = await supabaseAdmin.storage.from("articles").upload(fileName, bytes, { contentType: file.type })
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
      const { data: urlData } = supabaseAdmin.storage.from("articles").getPublicUrl(fileName)
      data.imageUrl = urlData.publicUrl
    }

    const article = await prisma.article.update({ where: { id }, data })
    return NextResponse.json({ article })
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
  await prisma.article.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
