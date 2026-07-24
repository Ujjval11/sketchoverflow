"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function estimateReadTime(content: string): string {
  const wpm = 200
  const words = content?.split(/\s+/).length || 0
  const min = Math.max(1, Math.ceil(words / wpm))
  return `${min} min read`
}

export function ArticlesSection() {
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => setArticles((d.articles || []).slice(0, 4)))
      .catch(() => {})
  }, [])

  if (articles.length === 0) return null

  return (
    <section className="border-t border-border py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary bg-primary/5 px-3 py-1 rounded-full mb-4">
            Learning Lab
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">Learn from the Pros</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Tips, tutorials and insights to level up your drawing skills — curated by the SketchOverflow team.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 gap-6"
        >
          {articles.map((article: any, i: number) => (
            <motion.div key={article.id} variants={item}>
              <Link href={`/articles/${article.slug}`} className="group block h-full">
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  {article.imageUrl ? (
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                      <div className="text-4xl opacity-30">
                        {["✏️", "🎨", "🖌️", "📐"][i % 4]}
                      </div>
                    </div>
                  )}
                  <div className="p-5 space-y-3 flex flex-col flex-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <span>{article.author?.name || "SketchOverflow"}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={article.createdAt}>
                        {new Date(article.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                      <span aria-hidden="true">·</span>
                      <span>{estimateReadTime(article.content)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link href="/articles">
            <Button variant="outline" size="lg">
              View All Articles
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
