import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma/db"

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const article = await prisma.article.findUnique({
      where: { slug, isPublished: true },
    })
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const author = await prisma.user.findUnique({ where: { id: (article as any).authorId }, select: "name, avatarUrl" })
    return NextResponse.json({ article: { ...article, author } })
    return NextResponse.json({ article })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}
