"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => setArticles(d.articles || []))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Articles</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tips, tutorials, and insights to improve your drawing practice.
        </p>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-medium">No Articles Yet</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for new content!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                {article.imageUrl && (
                  <div className="aspect-[16/9] bg-muted overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-5 space-y-2">
                  <h2 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <span>{article.author?.name || "Anonymous"}</span>
                    <span>·</span>
                    <time dateTime={article.createdAt}>
                      {new Date(article.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </time>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
