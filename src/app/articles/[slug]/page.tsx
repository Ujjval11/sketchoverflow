"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function ArticlePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/articles/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found")
        return r.json()
      })
      .then((d) => setArticle(d.article))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h1 className="text-2xl font-bold">Article Not Found</h1>
        <p className="text-muted-foreground">This article does not exist or has been unpublished.</p>
        <Link href="/articles" className="text-primary hover:underline text-sm">← Back to Articles</Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <Link href="/articles" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
        ← Back to Articles
      </Link>

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold">{article.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{article.author?.name || "Anonymous"}</span>
          <span>·</span>
          <time dateTime={article.createdAt}>
            {new Date(article.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </time>
        </div>
      </div>

      {article.imageUrl && (
        <div className="aspect-[16/9] bg-muted rounded-xl overflow-hidden">
          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {article.excerpt && (
              <p className="text-muted-foreground italic mb-6 text-base">{article.excerpt}</p>
            )}
            {article.content}
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
