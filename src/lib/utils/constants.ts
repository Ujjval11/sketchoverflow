export const SITE_NAME = "SketchOverFlow"
export const SITE_DESCRIPTION = "Practice Every Day. Draw Like a Professional."
export const SITE_URL = "https://sketchoverflow.app"

export const DIFFICULTY_OPTIONS = [
  { label: "Beginner", value: "BEGINNER" },
  { label: "Upper", value: "INTERMEDIATE" },
  { label: "Pro", value: "ADVANCED" },
] as const

export const TIMER_OPTIONS = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
  { label: "5m", value: 300 },
  { label: "20m", value: 1200 },
  { label: "30m", value: 1800 },
  { label: "60m", value: 3600 },
] as const

export const CHALLENGE_THEMES = [
  { name: "The Shadow Weaver", desc: "Master the art of light and shadow through dramatic value studies" },
  { name: "Gesture Storm", desc: "Quick fire gesture drawing sprint to capture motion" },
  { name: "Anatomy Architect", desc: "Build your figure drawing foundation one study at a time" },
  { name: "The Line Whisperer", desc: "Perfect your contour lines with flowing precision" },
  { name: "Perspective Master", desc: "Conquer depth and dimension in your compositions" },
  { name: "The Color Alchemist", desc: "Transform your color theory with bold experiments" },
  { name: "Portrait Prodigy", desc: "Capture the essence and soul of every face" },
  { name: "The Storyteller", desc: "Narrative illustration challenge - let your art speak" },
  { name: "Morph Master", desc: "Transform and distort creatively with wild imagination" },
  { name: "The Minimalist", desc: "Less is more - simplify your art to pure essentials" },
  { name: "Texture Hunter", desc: "Explore surface, material and tactile sensations" },
  { name: "The Speed Demon", desc: "Ultra fast sketching sprint for lightning reflexes" },
] as const

export const CHALLENGE_TYPES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Special", value: "special" },
] as const

export const XP_PER_SESSION = 10
export const XP_BONUS_STREAK = 5
export const XP_PERFECT_SCORE = 15
export const XP_DAILY_CHALLENGE = 25

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
  10000, 13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000,
  70000, 81500, 94500, 109000, 125000, 143000, 163000, 185000, 210000, 238000,
]

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXPForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return 0
  return LEVEL_THRESHOLDS[level]
}

export function getXPProgress(xp: number): { current: number; needed: number; progress: number } {
  const level = getLevel(xp)
  const currentLevelXP = LEVEL_THRESHOLDS[level - 1] || 0
  const nextLevelXP = getXPForNextLevel(level)
  if (nextLevelXP === 0) return { current: 0, needed: 0, progress: 1 }
  const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP)
  return { current: xp - currentLevelXP, needed: nextLevelXP - currentLevelXP, progress: Math.min(progress, 1) }
}
