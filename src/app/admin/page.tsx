"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { TIMER_OPTIONS, DIFFICULTY_OPTIONS, CHALLENGE_THEMES, CHALLENGE_TYPES } from "@/lib/utils/constants"

const DURATIONS = TIMER_OPTIONS.filter((d) => [30, 60, 120, 300].includes(d.value))

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("categories")
  const [categories, setCategories] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>({})
  const [challenges, setChallenges] = useState<any[]>([])
  const [catForm, setCatForm] = useState({ name: "", description: "", sortOrder: 0, id: "" })
  const [showCatForm, setShowCatForm] = useState(false)
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({})
  const [sectionFiles, setSectionFiles] = useState<Record<string, FileList | null>>({})
  const [sectionUploading, setSectionUploading] = useState<string | null>(null)

  const [challengeForm, setChallengeForm] = useState<any>({
    id: "", title: "", type: "weekly", description: "", difficulty: "", duration: "",
    rewardTitle: "", rewardXP: 50, rewardCoins: 10, isActive: true, sortOrder: 0, file: null,
    startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 7*86400000).toISOString().slice(0, 10),
  })
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)

  const [articles, setArticles] = useState<any[]>([])
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [articleForm, setArticleForm] = useState<any>({
    id: "", title: "", slug: "", excerpt: "", content: "", imageUrl: "", isPublished: true, sortOrder: 0, file: null,
  })

  const [apiError, setApiError] = useState("")

  useEffect(() => {
    if (activeTab === "categories") loadCategories()
    if (activeTab === "analytics") loadAnalytics()
    if (activeTab === "challenges") loadChallenges()
    if (activeTab === "articles") loadArticles()
  }, [activeTab])

  async function loadCategories() {
    try {
      const r = await fetch("/api/admin/categories")
      const d = await r.json()
      if (d.error) { setApiError(d.error); return }
      const cats = d.categories || []
      const withImages = await Promise.all(
        cats.map(async (cat: any) => {
          const ir = await fetch(`/api/admin/images?categoryId=${cat.id}`)
          const id = await ir.json()
          if (id.error) { setApiError(id.error); return cat }
          const allImages = id.images || []
          const sectionImages: Record<string, Record<number, any[]>> = {}
          for (const diff of DIFFICULTY_OPTIONS) {
            sectionImages[diff.value] = {}
            for (const dur of DURATIONS) {
              sectionImages[diff.value][dur.value] = allImages.filter(
                (img: any) => img.difficulty === diff.value && img.duration === dur.value
              )
            }
          }
          return { ...cat, images: allImages, sectionImages }
        })
      )
      setCategories(withImages)
    } catch (e: any) { setApiError("Failed to load categories") }
  }

  async function loadAnalytics() {
    try {
      const r = await fetch("/api/admin/analytics")
      const d = await r.json()
      if (d.error) { setApiError(d.error); return }
      setAnalytics(d)
    } catch { setApiError("Failed to load analytics") }
  }

  async function loadChallenges() {
    try {
      const r = await fetch("/api/admin/challenges")
      const d = await r.json()
      if (d.error) { setApiError(d.error); return }
      setChallenges(d.challenges || [])
    } catch { setApiError("Failed to load challenges") }
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!catForm.name.trim()) return
    const method = catForm.id ? "PUT" : "POST"
    await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    })
    setCatForm({ name: "", description: "", sortOrder: 0, id: "" })
    setShowCatForm(false)
    loadCategories()
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its images?")) return
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" })
    loadCategories()
  }

  async function uploadToSection(categoryId: string, difficulty: string, duration: number) {
    const key = `${categoryId}-${difficulty}-${duration}`
    const files = sectionFiles[key]
    if (!files || files.length === 0) return
    setSectionUploading(key)
    let ok = true
    for (let i = 0; i < files.length; i++) {
      try {
        const form = new FormData()
        form.set("file", files[i])
        form.set("categoryId", categoryId)
        form.set("isPublished", "true")
        form.set("duration", String(duration))
        form.set("difficulty", difficulty)
        const r = await fetch("/api/admin/images", { method: "POST", body: form })
        const d = await r.json()
        if (!r.ok) { setApiError(d.error || "Upload failed"); ok = false; break }
      } catch (e: any) {
        setApiError(e.message || "Upload failed")
        ok = false
        break
      }
    }
    if (ok) setSectionFiles((prev) => ({ ...prev, [key]: null }))
    loadCategories()
    setSectionUploading(null)
  }

  async function togglePublish(image: any) {
    await fetch("/api/admin/images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: image.id, isPublished: !image.isPublished }),
    })
    loadCategories()
  }

  async function deleteImage(id: string) {
    if (!confirm("Delete this image?")) return
    const r = await fetch(`/api/admin/images?id=${id}`, { method: "DELETE" })
    if (!r.ok) {
      const d = await r.json()
      alert(d.error || "Failed to delete image")
    }
    loadCategories()
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return null
    const opt = TIMER_OPTIONS.find((d) => d.value === seconds)
    return opt?.label || `${seconds}s`
  }

  async function saveChallenge(e: React.FormEvent) {
    e.preventDefault()
    if (!challengeForm.title.trim() || !challengeForm.type) return
    const formData = new FormData()
    formData.set("title", challengeForm.title)
    formData.set("type", challengeForm.type)
    formData.set("description", challengeForm.description)
    formData.set("difficulty", challengeForm.difficulty)
    formData.set("duration", challengeForm.duration)
    formData.set("rewardTitle", challengeForm.rewardTitle)
    formData.set("rewardXP", String(challengeForm.rewardXP))
    formData.set("rewardCoins", String(challengeForm.rewardCoins))
    formData.set("isActive", String(challengeForm.isActive))
    formData.set("sortOrder", String(challengeForm.sortOrder))
    formData.set("startDate", challengeForm.startDate)
    formData.set("endDate", challengeForm.endDate)
    if (challengeForm.file) formData.set("file", challengeForm.file)

    const method = challengeForm.id ? "PUT" : "POST"
    const url = challengeForm.id ? `/api/admin/challenges` : `/api/admin/challenges`
    if (challengeForm.id) formData.set("id", challengeForm.id)

    await fetch(url, { method, body: formData })
    resetChallengeForm()
    loadChallenges()
  }

  function resetChallengeForm() {
    setChallengeForm({
      id: "", title: "", type: "weekly", description: "", difficulty: "", duration: "",
      rewardTitle: "", rewardXP: 50, rewardCoins: 10, isActive: true, sortOrder: 0, file: null,
      startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 7*86400000).toISOString().slice(0, 10),
    })
    setShowChallengeForm(false)
    setSelectedChallenge(null)
  }

  function editChallenge(c: any) {
    setChallengeForm({
      id: c.id,
      title: c.title,
      type: c.type,
      description: c.description || "",
      difficulty: c.difficulty || "",
      duration: c.duration ? String(c.duration) : "",
      rewardTitle: c.rewardTitle || "",
      rewardXP: c.rewardXP,
      rewardCoins: c.rewardCoins,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      file: null,
      startDate: new Date(c.startDate).toISOString().slice(0, 10),
      endDate: new Date(c.endDate).toISOString().slice(0, 10),
    })
    setShowChallengeForm(true)
    setSelectedChallenge(c)
  }

  async function deleteChallenge(id: string) {
    if (!confirm("Delete this challenge?")) return
    await fetch(`/api/admin/challenges?id=${id}`, { method: "DELETE" })
    loadChallenges()
    if (selectedChallenge?.id === id) setSelectedChallenge(null)
  }

  async function loadArticles() {
    try {
      const r = await fetch("/api/admin/articles")
      const d = await r.json()
      if (d.error) { setApiError(d.error); return }
      setArticles(d.articles || [])
    } catch { setApiError("Failed to load articles") }
  }

  async function saveArticle(e: React.FormEvent) {
    e.preventDefault()
    if (!articleForm.title.trim() || !articleForm.content.trim()) return
    const formData = new FormData()
    formData.set("title", articleForm.title)
    formData.set("slug", articleForm.slug)
    formData.set("excerpt", articleForm.excerpt)
    formData.set("content", articleForm.content)
    formData.set("isPublished", String(articleForm.isPublished))
    formData.set("sortOrder", String(articleForm.sortOrder))
    if (articleForm.file) formData.set("file", articleForm.file)

    const method = articleForm.id ? "PUT" : "POST"
    if (articleForm.id) formData.set("id", articleForm.id)

    await fetch("/api/admin/articles", { method, body: formData })
    resetArticleForm()
    loadArticles()
  }

  function resetArticleForm() {
    setArticleForm({ id: "", title: "", slug: "", excerpt: "", content: "", imageUrl: "", isPublished: true, sortOrder: 0, file: null })
    setShowArticleForm(false)
  }

  function editArticle(a: any) {
    setArticleForm({
      id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt || "", content: a.content,
      imageUrl: a.imageUrl || "", isPublished: a.isPublished, sortOrder: a.sortOrder, file: null,
    })
    setShowArticleForm(true)
  }

  async function deleteArticle(id: string) {
    if (!confirm("Delete this article?")) return
    await fetch(`/api/admin/articles?id=${id}`, { method: "DELETE" })
    loadArticles()
  }

  const tabs = [
    { key: "categories", label: "Categories & Images" },
    { key: "challenges", label: "Challenges" },
    { key: "articles", label: "Articles" },
    { key: "analytics", label: "Analytics" },
    { key: "users", label: "Users" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage categories, challenges, articles, images, users, and analytics</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {apiError && (
        <div className="rounded-lg bg-error/10 border border-error/30 p-3 text-sm text-error flex items-center justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError("")} className="text-error/60 hover:text-error">✕</button>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{categories.length} categories</p>
            <Button onClick={() => { setCatForm({ name: "", description: "", sortOrder: 0, id: "" }); setShowCatForm(!showCatForm) }}>
              {showCatForm ? "Cancel" : "+ Add Category"}
            </Button>
          </div>

          {showCatForm && (
            <Card>
              <CardHeader><CardTitle>{catForm.id ? "Edit Category" : "New Category"}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={saveCategory} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Human Figure" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} placeholder="Optional" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{catForm.id ? "Update" : "Create"}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCatForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {categories.map((cat: any) => (
            <Card key={cat.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{cat.images?.length || 0} images · {cat.description || "—"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCatForm({ name: cat.name, description: cat.description || "", sortOrder: cat.sortOrder, id: cat.id }); setShowCatForm(true) }}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">Edit</button>
                  <button onClick={() => deleteCategory(cat.id)}
                    className="text-xs px-2 py-1 rounded border border-error/30 text-error hover:bg-error/5">Delete</button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {DIFFICULTY_OPTIONS.map((diff) => (
                  <div key={diff.value} className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{diff.label}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {DURATIONS.map((dur) => {
                        const sectionImgs = cat.sectionImages?.[diff.value]?.[dur.value] || []
                        const key = `${cat.id}-${diff.value}-${dur.value}`
                        const isUploading = sectionUploading === key
                        const hasFile = !!sectionFiles[key]
                        const isOpen = sectionOpen[key]
                        return (
                          <div key={dur.value} className="rounded-lg border border-border overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">{dur.label}</span>
                                <span className="text-xs text-muted-foreground">({sectionImgs.length})</span>
                              </div>
                              <button onClick={() => { setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] })); setSectionFiles((prev) => ({ ...prev, [key]: null })) }}
                                className="text-xs px-1.5 py-0.5 rounded bg-primary text-white hover:bg-primary/90"
                              >
                                {isOpen ? "✕" : "+"}
                              </button>
                            </div>
                            {sectionImgs.length > 0 && (
                              <div className="p-2">
                                <div className="grid grid-cols-3 gap-1.5">
                                  {sectionImgs.map((img: any) => (
                                    <ImageThumb key={img.id} img={img} formatDuration={formatDuration} togglePublish={togglePublish} deleteImage={deleteImage} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {isOpen && (
                              <div className="px-2 pb-2">
                                <div className="flex items-end gap-2 p-2 rounded-lg bg-muted/30">
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <Label className="text-[10px]">Files</Label>
                                    <Input type="file" accept="image/*" multiple className="text-xs h-8" onChange={(e) => setSectionFiles((prev) => ({ ...prev, [key]: e.target.files || null }))} />
                                  </div>
                                  <Button size="sm" onClick={() => uploadToSection(cat.id, diff.value, dur.value)} disabled={!hasFile || isUploading}>
                                    {isUploading ? "..." : "Upload"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {(() => {
                  const other = (cat.images || []).filter((img: any) =>
                    !img.difficulty || !DIFFICULTY_OPTIONS.some((d) => d.value === img.difficulty) ||
                    !DURATIONS.some((d) => d.value === img.duration)
                  )
                  if (other.length === 0) return null
                  return (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Other</span>
                          <span className="text-xs text-muted-foreground">({other.length} images)</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {other.map((img: any) => (
                            <ImageThumb key={img.id} img={img} formatDuration={formatDuration} togglePublish={togglePublish} deleteImage={deleteImage} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "challenges" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{challenges.length} challenges</p>
            <Button onClick={() => { resetChallengeForm(); setShowChallengeForm(!showChallengeForm) }}>
              {showChallengeForm ? "Cancel" : "+ Create Challenge"}
            </Button>
          </div>

          {showChallengeForm && (
            <Card>
              <CardHeader><CardTitle>{challengeForm.id ? "Edit Challenge" : "New Challenge"}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={saveChallenge} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Challenge Name</Label>
                      <div className="flex gap-2">
                        <select value={challengeForm.title} onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                          className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm">
                          <option value="">Custom name below</option>
                          {CHALLENGE_THEMES.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Custom Name</Label>
                      <Input value={challengeForm.title} onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })} placeholder="Or type custom name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={challengeForm.description} onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })} placeholder="Challenge description" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <select value={challengeForm.type} onChange={(e) => setChallengeForm({ ...challengeForm, type: e.target.value })}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                        {CHALLENGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <select value={challengeForm.difficulty} onChange={(e) => setChallengeForm({ ...challengeForm, difficulty: e.target.value })}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                        <option value="">Any</option>
                        {DIFFICULTY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (seconds)</Label>
                      <select value={challengeForm.duration} onChange={(e) => setChallengeForm({ ...challengeForm, duration: e.target.value })}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                        <option value="">Any</option>
                        {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reward Title (e.g. Gold Medal)</Label>
                      <Input value={challengeForm.rewardTitle} onChange={(e) => setChallengeForm({ ...challengeForm, rewardTitle: e.target.value })} placeholder="Gold Medal" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reward XP</Label>
                      <Input type="number" value={challengeForm.rewardXP} onChange={(e) => setChallengeForm({ ...challengeForm, rewardXP: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reward Coins</Label>
                      <Input type="number" value={challengeForm.rewardCoins} onChange={(e) => setChallengeForm({ ...challengeForm, rewardCoins: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Input type="number" value={challengeForm.sortOrder} onChange={(e) => setChallengeForm({ ...challengeForm, sortOrder: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={challengeForm.startDate} onChange={(e) => setChallengeForm({ ...challengeForm, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={challengeForm.endDate} onChange={(e) => setChallengeForm({ ...challengeForm, endDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Challenge Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setChallengeForm({ ...challengeForm, file: e.target.files?.[0] || null })} />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="isActive" checked={challengeForm.isActive} onChange={(e) => setChallengeForm({ ...challengeForm, isActive: e.target.checked })} />
                      <Label htmlFor="isActive">Active (visible to users)</Label>
                    </div>
                  </div>
                  <Button type="submit">{challengeForm.id ? "Update Challenge" : "Create Challenge"}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((c: any) => {
              const isSelected = selectedChallenge?.id === c.id
              return (
                <Card key={c.id} className={isSelected ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">{c.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {c.isActive ? "Active" : "Draft"}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{c.type}</span>
                      <span>·</span>
                      <span>{c._count?.participants || 0} participants</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>{c.rewardXP} XP · {c.rewardCoins} coins</span>
                      <div className="flex gap-1">
                        <button onClick={() => { editChallenge(c); setSelectedChallenge(c) }}
                          className="px-2 py-0.5 rounded border border-border hover:bg-muted text-xs">Edit</button>
                        <button onClick={() => deleteChallenge(c.id)}
                          className="px-2 py-0.5 rounded border border-error/30 text-error hover:bg-error/5 text-xs">Delete</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {challenges.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">No challenges yet. Create your first one!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "articles" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{articles.length} articles</p>
            <Button onClick={() => { resetArticleForm(); setShowArticleForm(!showArticleForm) }}>
              {showArticleForm ? "Cancel" : "+ New Article"}
            </Button>
          </div>

          {showArticleForm && (
            <Card>
              <CardHeader><CardTitle>{articleForm.id ? "Edit Article" : "New Article"}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={saveArticle} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug (leave blank to auto-generate)</Label>
                      <Input value={articleForm.slug} onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })} placeholder="auto-generated" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Excerpt</Label>
                      <textarea value={articleForm.excerpt} onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                        className="w-full min-h-[60px] rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Brief summary" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Content (Markdown / HTML)</Label>
                      <textarea value={articleForm.content} onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                        className="w-full min-h-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setArticleForm({ ...articleForm, file: e.target.files?.[0] || null })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Sort Order</Label>
                      <Input type="number" value={articleForm.sortOrder} onChange={(e) => setArticleForm({ ...articleForm, sortOrder: Number(e.target.value) })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="articlePublished" checked={articleForm.isPublished} onChange={(e) => setArticleForm({ ...articleForm, isPublished: e.target.checked })} />
                      <Label htmlFor="articlePublished">Published (visible to users)</Label>
                    </div>
                  </div>
                  <Button type="submit">{articleForm.id ? "Update Article" : "Create Article"}</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {articles.map((a: any) => (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm truncate">{a.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${a.isPublished ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {a.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    {a.excerpt && <p className="text-xs text-muted-foreground truncate">{a.excerpt}</p>}
                    <p className="text-[10px] text-muted-foreground">/{a.slug} · {a.author?.name || "Anonymous"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => editArticle(a)} className="px-2 py-0.5 rounded border border-border hover:bg-muted text-xs">Edit</button>
                    <button onClick={() => deleteArticle(a.id)} className="px-2 py-0.5 rounded border border-error/30 text-error hover:bg-error/5 text-xs">Delete</button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {articles.length === 0 && (
              <p className="text-sm text-muted-foreground">No articles yet. Create your first one!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={String(analytics.totalUsers || 0)} />
          <StatCard label="Sessions Today" value={String(analytics.todaySessions || 0)} />
          <StatCard label="Total Images" value={String(analytics.totalImages || 0)} />
          <StatCard label="Total Sessions" value={String(analytics.totalSessions || 0)} />
        </div>
      )}

      {activeTab === "users" && (
        <div className="flex gap-3 items-center text-sm text-muted-foreground p-4 rounded-lg bg-muted/30">
          <span>Full user management with role controls:</span>
          <a href="/admin/users" className="text-primary hover:underline font-medium">Go to User Management →</a>
        </div>
      )}
    </div>
  )
}

function ImageThumb({ img, formatDuration, togglePublish, deleteImage }: {
  img: any; formatDuration: (s: number | null) => string | null; togglePublish: (img: any) => void; deleteImage: (id: string) => void
}) {
  return (
    <div className="group relative rounded-lg overflow-hidden border border-border bg-muted/30">
      <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
        <img src={img.url} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => togglePublish(img)}
          className={`text-xs px-1.5 py-0.5 rounded ${img.isPublished ? "bg-success/80 text-white" : "bg-muted/80 text-muted-foreground"}`}>
          {img.isPublished ? "Pub" : "Draft"}
        </button>
        <button onClick={() => deleteImage(img.id)}
          className="text-xs px-1.5 py-0.5 rounded bg-error/80 text-white">✕</button>
      </div>
      <div className="absolute bottom-1 left-1">
        <span className={`text-[10px] px-1 py-0.5 rounded ${img.isPublished ? "bg-success/80 text-white" : "bg-muted/80 text-muted-foreground"}`}>
          {img.isPublished ? "Published" : "Draft"}
        </span>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
