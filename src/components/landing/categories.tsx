"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function CategoriesSection() {
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Practice Categories</h2>
          <p className="text-muted-foreground mt-2">Choose from a wide range of drawing references</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 10) * 0.05 }}>
              <Link
                href={cat.imageCount > 0 ? `/practice?category=${cat.slug}` : "#"}
                className={`block rounded-xl border border-border bg-card p-4 text-center hover:border-primary/50 hover:shadow-md transition-all ${cat.imageCount === 0 ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="text-3xl mb-2">{cat.icon || "🎨"}</div>
                <h3 className="font-medium text-sm">{cat.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.imageCount} images</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
