import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { prisma } from "@/lib/prisma/db"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const categoryId = formData.get("categoryId") as string
    if (!file || !categoryId) return NextResponse.json({ error: "Missing file or category" }, { status: 400 })

    const { data: bucket } = await supabaseAdmin.storage.getBucket("references")
    if (!bucket) {
      await supabaseAdmin.storage.createBucket("references", { public: true, fileSizeLimit: 10485760 })
    }

    const ext = file.name.split(".").pop() || "png"
    const fileName = `references/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage.from("references").upload(fileName, bytes, { contentType: file.type })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabaseAdmin.storage.from("references").getPublicUrl(fileName)
    const url = urlData.publicUrl

    const image = await prisma.referenceImage.create({
      data: { url, categoryId, isPublished: true },
    })
    await prisma.category.update({ where: { id: categoryId }, data: { imageCount: { increment: 1 } } })

    return NextResponse.json({ image }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 })
  }
}
