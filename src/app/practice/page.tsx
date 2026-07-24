"use client"

import { Suspense } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useCallback } from "react"
import { TIMER_OPTIONS, DIFFICULTY_OPTIONS } from "@/lib/utils/constants"

type Step = "category" | "difficulty" | "time" | "active" | "complete"

function PracticeContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const userRef = useRef(user)
  userRef.current = user

  const [step, setStep] = useState<Step>("category")
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCat, setSelectedCat] = useState<any>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState("BEGINNER")
  const [selectedTime, setSelectedTime] = useState(60)
  const [images, setImages] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionStats, setSessionStats] = useState({ completed: 0, skipped: 0 })

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const cat = searchParams.get("category")
    if (cat && !loading && !userRef.current) {
      router.push(`/login?redirect=/practice?category=${cat}`)
    }
  }, [searchParams, loading, router])

  function selectCategory(cat: any) {
    if (!userRef.current) {
      router.push(`/login?redirect=/practice?category=${cat.slug}`)
      return
    }
    setSelectedCat(cat)
    setStep("difficulty")
  }

  function selectDifficulty(diff: string) {
    setSelectedDifficulty(diff)
    setStep("time")
  }

  async function startPractice(duration: number) {
    setSelectedTime(duration)
    const r = await fetch(`/api/references?category=${selectedCat.slug}&duration=${duration}&difficulty=${selectedDifficulty}&limit=50`)
    const d = await r.json()
    const shuffled = shuffle(d.images || [])
    if (shuffled.length === 0) {
      setStep("time")
      return
    }
    setImages(shuffled)
    setCurrentIndex(0)
    setTimeLeft(duration)
    setSessionStats({ completed: 0, skipped: 0 })
    setStep("active")
  }

  useEffect(() => {
    if (step !== "active" || isPaused) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          advanceImage()
          return selectedTime
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, isPaused, selectedTime])

  function advanceImage() {
    setCurrentIndex(prev => {
      if (prev >= images.length - 1) {
        setStep("complete")
        return prev
      }
      return prev + 1
    })
    setSessionStats(s => ({ ...s, completed: s.completed + 1 }))
  }

  function skipImage() {
    setCurrentIndex(prev => {
      if (prev >= images.length - 1) {
        setStep("complete")
        return prev
      }
      return prev + 1
    })
    setTimeLeft(selectedTime)
    setSessionStats(s => ({ ...s, skipped: s.skipped + 1 }))
  }

  async function finishSession() {
    await fetch("/api/sessions/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessions: images.slice(0, currentIndex + 1).map(img => ({
          referenceId: img.id,
          duration: selectedTime,
        })),
      }),
    })
    setStep("category")
    setSelectedCat(null)
    setSelectedDifficulty("BEGINNER")
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>

  if (step === "category") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Choose a Category</h1>
        <p className="text-muted-foreground mb-8">Select what you want to practice</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => selectCategory(cat)}
              className="rounded-xl border border-border bg-card p-6 text-center hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{cat.icon || "🎨"}</div>
              <h3 className="font-medium text-sm">{cat.name}</h3>
              {cat.imageCount > 0 && <p className="text-xs text-muted-foreground mt-1">{cat.imageCount} images</p>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === "difficulty") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <button onClick={() => setStep("category")} className="text-sm text-muted-foreground hover:text-foreground mb-6 block">
          ← Back to categories
        </button>
        <h2 className="text-2xl font-bold mb-2">{selectedCat?.name}</h2>
        <p className="text-muted-foreground mb-8">Select difficulty level</p>
        <div className="grid grid-cols-3 gap-4">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button key={d.value} onClick={() => selectDifficulty(d.value)}
              className={`rounded-xl border p-8 text-center hover:border-primary/50 hover:shadow-md transition-all ${
                selectedDifficulty === d.value ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="text-2xl font-bold">{d.label}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === "time") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <button onClick={() => setStep("difficulty")} className="text-sm text-muted-foreground hover:text-foreground mb-6 block">
          ← Back to difficulty
        </button>
        <h2 className="text-2xl font-bold mb-2">{selectedCat?.name} · {DIFFICULTY_OPTIONS.find(d => d.value === selectedDifficulty)?.label}</h2>
        <p className="text-muted-foreground mb-8">Select time per image</p>
        <div className="grid grid-cols-3 gap-3">
          {TIMER_OPTIONS.filter(t => [30, 60, 120, 300].includes(t.value)).map(t => (
            <button key={t.value} onClick={() => startPractice(t.value)}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="text-lg font-bold">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === "active" && images.length > 0) {
    const img = images[currentIndex]
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{currentIndex + 1} / {images.length}</p>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-mono font-bold tabular-nums">{timeLeft}s</div>
            <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button variant="ghost" size="sm" onClick={skipImage}>Skip</Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="aspect-[4/3] bg-muted flex items-center justify-center">
              <img src={img.url} alt="" className="w-full h-full object-contain" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "complete") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold">Session Complete!</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="text-2xl font-bold">{sessionStats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="text-2xl font-bold">{sessionStats.skipped}</div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </div>
        </div>
        <Button size="lg" className="w-full" onClick={finishSession}>Save & Finish</Button>
        <Button variant="outline" className="w-full" onClick={() => { setStep("category"); setSelectedCat(null) }}>Practice Again</Button>
      </div>
    )
  }

  return null
}

export default function PracticePage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
    <PracticeContent />
  </Suspense>
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
