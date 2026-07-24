import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    })
    const result = await Promise.all((articles as any[]).map(async (a) => {
      const author = await prisma.user.findUnique({ where: { id: a.authorId }, select: "name" })
      return { id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt, imageUrl: a.imageUrl, createdAt: a.createdAt, author }
    }))
    return NextResponse.json({ articles })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}
