import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma/db"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ user: null, profile: null }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: dbUser?.name || user.user_metadata?.full_name || user.email,
      avatarUrl: user.user_metadata?.avatar_url || dbUser?.avatarUrl || null,
      role: dbUser?.role || null,
    },
    profile: profile || null,
  })
}
