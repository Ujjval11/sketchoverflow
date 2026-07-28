import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorySlug = searchParams.get("category")
  const duration = searchParams.get("duration")
  const difficulty = searchParams.get("difficulty")

  try {
    const filters: Record<string, unknown> = { isPublished: true }

    if (duration) {
      filters.duration = Number(duration)
    }

    if (difficulty) {
      filters.difficulty = difficulty
    }

    if (categorySlug) {
      const { data: cat } = await supabaseAdmin
        .from("Category")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle()
      if (cat) {
        filters.categoryId = cat.id
      } else {
        return NextResponse.json({ images: [], total: 0 })
      }
    }

    const [allImages, total] = await Promise.all([
      prisma.referenceImage.findMany({ where: filters, take: 1000 }),
      prisma.referenceImage.count({ where: filters }),
    ])
    const images = allImages.sort(() => Math.random() - 0.5)
    return NextResponse.json({ images, total })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch references" }, { status: 500 })
  }
}
