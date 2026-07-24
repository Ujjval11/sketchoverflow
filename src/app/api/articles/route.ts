import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    })
    return NextResponse.json({ articles })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}
