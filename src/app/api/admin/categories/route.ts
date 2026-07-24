import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const db = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!db || db.role !== "admin") return null
  return user
}

export async function GET() {
  try {
    const admin = await checkAdmin()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    }) as any[]
    const result = await Promise.all(categories.map(async (c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageCount: (await prisma.referenceImage.count({ where: { categoryId: c.id } })),
      sortOrder: c.sortOrder,
    })))
    return NextResponse.json({ categories: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const { name, description, sortOrder } = await request.json()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const cat = await prisma.category.create({ data: { name, slug, description, sortOrder: sortOrder || 0 } })
    return NextResponse.json({ category: cat }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    const { id, name, description, sortOrder } = await request.json()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const cat = await prisma.category.update({ where: { id }, data: { name, slug, description, sortOrder } })
    return NextResponse.json({ category: cat })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
