import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { images: { where: { isPublished: true } } } } },
    })
    const result = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageCount: c._count.images,
      sortOrder: c.sortOrder,
    }))
    return NextResponse.json({ categories: result })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
