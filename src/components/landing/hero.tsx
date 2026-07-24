"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Hero() {
  const [images, setImages] = useState<string[]>([])
  const [showIdx, setShowIdx] = useState(0)

  useEffect(() => {
    fetch("/api/references?limit=50")
      .then((r) => r.json())
      .then((d) => {
        const urls = (d.images || []).map((img: any) => img.url)
        setImages(shuffle(urls))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (images.length === 0) return
    const timer = setInterval(() => {
      setShowIdx((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images])

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Practice Every Day.
                <span className="text-primary block">Draw Like a Professional.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Improve your observation, anatomy, gesture, perspective, and creativity using thousands of timed references.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/practice"><Button size="lg" className="text-base">
                Start Practicing
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button></Link>
              <Link href="/challenges"><Button variant="outline" size="lg" className="text-base">Take Challenge</Button></Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted relative">
              {images.length > 0 ? (
                <div className="relative h-full w-full">
                  {images.slice(0, 10).map((url, i) => (
                    <img key={i} src={url} alt=""
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === showIdx ? "opacity-100" : "opacity-0"}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -top-4 -left-4 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
