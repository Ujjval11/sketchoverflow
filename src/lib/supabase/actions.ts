"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma/db"

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectTo = (formData.get("redirect") as string) || "/"

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  if (data.user) {
    const existing = await prisma.user.findUnique({ where: { id: data.user.id }, select: { id: true } })
    const now = new Date().toISOString()
    if (!existing) {
      const name = data.user.user_metadata?.full_name || email.split("@")[0]
      await prisma.user.create({ data: { id: data.user.id, email, name, createdAt: now, updatedAt: now, lastLogin: now } })
      await prisma.profile.upsert({
        where: { userId: data.user.id },
        update: {},
        create: { userId: data.user.id },
      })
    } else {
      await prisma.user.update({ where: { id: data.user.id }, data: { lastLogin: now } })
    }
  }
  revalidatePath("/", "layout")
  redirect(redirectTo)
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient()
  const redirectTo = (formData.get("redirect") as string) || "/"
  const host = (await headers()).get("host") || "sketchflow-amber.vercel.app"
  const callbackUrl = `https://${host}/api/auth/callback?next=${redirectTo}`
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl },
  })
  if (data.url) redirect(data.url)
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const bio = formData.get("bio") as string
  const goals = formData.get("goals") as string
  const institution = formData.get("institution") as string
  const educationLevel = formData.get("educationLevel") as string
  const city = formData.get("city") as string

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: name },
  })
  if (error) return { error: error.message }
  if (data.user) {
    const now = new Date().toISOString()
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { name, email },
      create: { id: data.user.id, email, name, createdAt: now, updatedAt: now },
    })
    await prisma.profile.upsert({
      where: { userId: data.user.id },
      update: { bio, goals, institution, educationLevel, city },
      create: { userId: data.user.id, bio, goals, institution, educationLevel, city },
    })
    await supabase.auth.signInWithPassword({ email, password })
  }
  revalidatePath("/", "layout")
  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/auth/update-password`,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get("password") as string
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  redirect("/")
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const name = formData.get("name") as string
  const bio = formData.get("bio") as string
  const phone = formData.get("phone") as string
  const age = formData.get("age") ? Number(formData.get("age")) : null
  const exam = formData.get("exam") as string
  const studyMode = formData.get("studyMode") as string
  const institution = formData.get("institution") as string
  const educationLevel = formData.get("educationLevel") as string
  const goals = formData.get("goals") as string
  const interests = formData.get("interests") as string
  const city = formData.get("city") as string
  const country = formData.get("country") as string

  await prisma.user.update({ where: { id: user.id }, data: { name } })
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { bio, phone, age, exam, studyMode, institution, educationLevel, goals, interests, city, country },
    create: { userId: user.id, bio, phone, age, exam, studyMode, institution, educationLevel, goals, interests, city, country },
  })
  revalidatePath("/settings")
  return { success: true }
}

export async function updateTheme(theme: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { theme },
    create: { userId: user.id, theme },
  })
  revalidatePath("/settings")
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const file = formData.get("avatar") as File
  if (!file) return { error: "No file" }

  const ext = file.name.split(".").pop() || "png"
  const fileName = `avatars/${user.id}_${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()
  const { data: bucket } = await supabaseAdmin.storage.getBucket("avatars")
  if (!bucket) {
    await supabaseAdmin.storage.createBucket("avatars", { public: true, fileSizeLimit: 2097152 })
  }
  const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(fileName, bytes, { contentType: file.type })
  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName)
  const avatarUrl = urlData.publicUrl
  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } })
  revalidatePath("/settings")
  return { avatarUrl }
}
