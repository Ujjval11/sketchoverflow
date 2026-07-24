const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const pg = require("pg")

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const categories = [
    { name: "Human Figure", slug: "human-figure", description: "Full body figure drawing references", sortOrder: 1 },
    { name: "Portrait", slug: "portrait", description: "Facial features and portrait studies", sortOrder: 2 },
    { name: "Hands", slug: "hands", description: "Hand gestures and anatomy", sortOrder: 3 },
    { name: "Feet", slug: "feet", description: "Feet and foot anatomy", sortOrder: 4 },
    { name: "Animals", slug: "animals", description: "Animal anatomy and gesture", sortOrder: 5 },
    { name: "Birds", slug: "birds", description: "Bird anatomy and poses", sortOrder: 6 },
    { name: "Architecture", slug: "architecture", description: "Buildings and architectural elements", sortOrder: 7 },
    { name: "Perspective", slug: "perspective", description: "Perspective drawing practice", sortOrder: 8 },
    { name: "Still Life", slug: "still-life", description: "Still life arrangements", sortOrder: 9 },
    { name: "Vehicles", slug: "vehicles", description: "Cars, bikes, and vehicles", sortOrder: 10 },
    { name: "Clothing Folds", slug: "clothing-folds", description: "Drapery and clothing fold studies", sortOrder: 11 },
    { name: "Nature", slug: "nature", description: "Landscapes and natural elements", sortOrder: 12 },
    { name: "Environment", slug: "environment", description: "Environment and scene design", sortOrder: 13 },
    { name: "Character Poses", slug: "character-poses", description: "Dynamic character pose references", sortOrder: 14 },
    { name: "Gesture Drawing", slug: "gesture-drawing", description: "Quick gesture drawing practice", sortOrder: 15 },
    { name: "Fashion Illustration", slug: "fashion-illustration", description: "Fashion figure drawing", sortOrder: 16 },
    { name: "Product Sketching", slug: "product-sketching", description: "Industrial design sketching", sortOrder: 17 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log("Seeded", categories.length, "categories")

  const achievements = [
    { name: "First Practice", description: "Complete your first practice session", icon: "🎯", xpReward: 10, condition: "sessions:1" },
    { name: "Dedicated Artist", description: "Complete 10 practice sessions", icon: "🔥", xpReward: 50, condition: "sessions:10" },
    { name: "Art Master", description: "Complete 100 practice sessions", icon: "🏆", xpReward: 200, condition: "sessions:100" },
    { name: "Streak Starter", description: "Maintain a 3-day streak", icon: "📅", xpReward: 30, condition: "streak:3" },
    { name: "Week Warrior", description: "Maintain a 7-day streak", icon: "⚡", xpReward: 100, condition: "streak:7" },
    { name: "Speed Sketcher", description: "Complete a session with 30s timer", icon: "⏱️", xpReward: 20, condition: "speed:30" },
    { name: "Explorer", description: "Practice in 5 different categories", icon: "🗺️", xpReward: 75, condition: "categories:5" },
    { name: "Perfect Score", description: "Rate a session 5 stars", icon: "⭐", xpReward: 15, condition: "rating:5" },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { name: ach.name },
      update: {},
      create: ach,
    })
  }
  console.log("Seeded", achievements.length, "achievements")

  const { createClient } = require("@supabase/supabase-js")
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const exists = existing?.users?.find(u => u.email === "demo@sketchflow.app")
  if (!exists) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "demo@sketchflow.app",
      password: "demo1234",
      email_confirm: true,
    })
    if (error) {
      console.error("Auth create error:", error.message)
    } else {
      const uid = data.user.id
      await prisma.user.upsert({
        where: { id: uid },
        update: { role: "admin" },
        create: { id: uid, email: "demo@sketchflow.app", name: "Demo Admin", role: "admin" },
      })
      console.log("Seeded demo admin user")
    }
  } else {
    console.log("Demo user already exists")
  }

  const challengeThemes = [
    { title: "The Gesture Storm", desc: "Quick fire gesture drawing sprint to capture motion", type: "weekly", difficulty: "BEGINNER", duration: 30, rewardTitle: "Lightning Sketcher", xp: 50, coins: 10 },
    { title: "The Shadow Weaver", desc: "Master the art of light and shadow through dramatic value studies", type: "weekly", difficulty: "INTERMEDIATE", duration: 120, rewardTitle: "Value Master", xp: 75, coins: 15 },
    { title: "The Speed Demon", desc: "Ultra fast sketching sprint for lightning reflexes", type: "daily", difficulty: "BEGINNER", duration: 30, rewardTitle: "Speedster", xp: 25, coins: 5 },
  ]

  for (const t of challengeThemes) {
    const existingC = await prisma.challenge.findFirst({ where: { title: t.title } })
    if (!existingC) {
      await prisma.challenge.create({
        data: {
          title: t.title,
          description: t.desc,
          type: t.type,
          difficulty: t.difficulty,
          duration: t.duration,
          rewardTitle: t.rewardTitle,
          rewardXP: t.xp,
          rewardCoins: t.coins,
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 86400000),
        },
      })
      console.log("Seeded challenge:", t.title)
    }
  }

  const demoUser = await prisma.user.findUnique({ where: { email: "demo@sketchflow.app" }, select: { id: true } })
  const demoUserId = demoUser?.id
  if (demoUserId) {
    const sampleArticles = [
      { title: "5 Tips to Improve Your Gesture Drawing", slug: "5-tips-gesture-drawing", excerpt: "Master the fundamentals of gesture drawing with these practical exercises that will transform your figure sketches.", content: "Gesture drawing is the foundation of figure drawing. Here are 5 tips to help you improve:\n\n1. Use a timer - Start with 30-second poses to train your eye to capture the essential lines.\n2. Focus on the line of action - Look for the spine curve or the main directional thrust of the pose.\n3. Draw from the shoulder - Use your whole arm, not just your wrist, for fluid lines.\n4. Exaggerate - Push the gesture further than reality to capture energy and movement.\n5. Practice daily - Even 5 minutes of gesture drawing each day will show improvement in weeks.", isPublished: true },
      { title: "Understanding Light and Shadow", slug: "understanding-light-shadow", excerpt: "A beginner's guide to value studies and how to see light like an artist.", content: "Light and shadow are what give form to your drawings. Here's how to approach value studies:\n\nStart by squinting at your subject to simplify values into just 3-5 distinct tones. Ignore details and focus on the big shapes of light and shadow.\n\nPractice with simple objects under a single light source. A sphere, cube, and cylinder are perfect for understanding how light wraps around form.\n\nRemember: shadows have edges. Hard edges suggest strong, direct light. Soft edges suggest diffused or reflected light.\n\nOnce you master monochrome values, you can move on to color temperature shifts in light and shadow.", isPublished: true },
      { title: "Building a Daily Drawing Habit", slug: "building-drawing-habit", excerpt: "How to stay consistent with your practice and build momentum that lasts.", content: "Consistency beats intensity every time. Here's how to build a daily drawing habit:\n\n1. Start small - Commit to just 5 minutes a day. Anyone can find 5 minutes.\n2. Set a trigger - Attach your practice to an existing habit (e.g., right after morning coffee).\n3. Remove friction - Have your sketchbook and pencil ready the night before.\n4. Track streaks - Use the app's streak counter to stay motivated.\n5. Forgive missed days - Don't break the chain twice. One missed day is okay; two becomes a new pattern.\n\nThe key is showing up. The skill will follow.", isPublished: false },
    ]
    for (const a of sampleArticles) {
      const existingA = await prisma.article.findFirst({ where: { slug: a.slug } })
      if (!existingA) {
        await prisma.article.create({
          data: { ...a, authorId: demoUserId, sortOrder: 0 },
        })
        console.log("Seeded article:", a.title)
      }
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
