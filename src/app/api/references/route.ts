import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorySlug = searchParams.get("category")
  const duration = searchParams.get("duration")
  const difficulty = searchParams.get("difficulty")

  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100)
  const offset = Number(searchParams.get("offset")) || 0

  try {
    const filters: Record<string, unknown> = { isPublished: true }

    if (duration) {
      filters.duration = Number(duration)
    }

    if (difficulty) {
      filters.difficulty = difficulty
    }

    if (categorySlug) {
      const { data: cat, error: catErr } = await supabaseAdmin
        .from("Category")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle()
      if (catErr) {
        return NextResponse.json({ error: "Category lookup failed: " + catErr.message }, { status: 500 })
      }
      if (!cat) {
        return NextResponse.json({ images: [], total: 0, limit, offset })
      }
      filters.categoryId = cat.id
    }

    const findManyPromise = prisma.referenceImage.findMany({
      where: filters,
      take: limit,
      skip: offset,
      orderBy: { uploadedAt: "desc" },
    })
    const countPromise = prisma.referenceImage.count({ where: filters })
    const [images, total] = await Promise.all([findManyPromise, countPromise])
    return NextResponse.json({ images, total, limit, offset })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch references", stack: e.stack }, { status: 500 })
  }
}
