import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { data: files, error } = await supabaseAdmin.storage.from("references").list("showcase", {
      sortBy: { column: "created_at", order: "desc" },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const images = (files || [])
      .filter((f: any) => !f.id?.endsWith(".keep") && f.metadata?.mimetype?.startsWith("image/"))
      .map((f: any) => {
        const { data: urlData } = supabaseAdmin.storage.from("references").getPublicUrl(`showcase/${f.name}`)
        return { url: urlData.publicUrl, name: f.name }
      })

    return NextResponse.json({ images })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "File required" }, { status: 400 })

    const ext = file.name.split(".").pop() || "png"
    const fileName = `showcase/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage.from("references").upload(fileName, bytes, {
      contentType: file.type,
      upsert: true,
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabaseAdmin.storage.from("references").getPublicUrl(fileName)
    return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { name } = await request.json()
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
    const { error } = await supabaseAdmin.storage.from("references").remove([`showcase/${name}`])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 })
  }
}
