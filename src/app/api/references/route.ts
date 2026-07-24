import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters: Record<string, unknown> = { isPublished: true }
  const category = searchParams.get("category")
  if (category) filters.category = { slug: category }
  const duration = searchParams.get("duration")
  if (duration) filters.duration = Number(duration)

  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100)
  const offset = Number(searchParams.get("offset")) || 0

  try {
    const [images, total] = await Promise.all([
      prisma.referenceImage.findMany({
        where: filters,
        include: { category: true },
        take: limit,
        skip: offset,
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.referenceImage.count({ where: filters }),
    ])
    return NextResponse.json({ images, total, limit, offset })
  } catch {
    return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 })
  }
}
