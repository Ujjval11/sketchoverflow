import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    })
    const result = await Promise.all(categories.map(async (c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageCount: await prisma.referenceImage.count({ where: { categoryId: c.id, isPublished: true } }),
      sortOrder: c.sortOrder,
    })))
    return NextResponse.json({ categories: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
