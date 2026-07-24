import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ user: null, profile: null }, { status: 401 })

    let role = user.user_metadata?.role || null
    let dbUser = null
    let profile = null

    try {
      dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      profile = await prisma.profile.findUnique({ where: { userId: user.id } })
      if (dbUser?.role) role = dbUser.role
    } catch {}

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: dbUser?.name || user.user_metadata?.full_name || user.email,
        avatarUrl: user.user_metadata?.avatar_url || dbUser?.avatarUrl || null,
        role,
      },
      profile: profile || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
  }
}
