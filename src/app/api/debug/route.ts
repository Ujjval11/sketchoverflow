import { NextResponse } from "next/server"

export async function GET() {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + "..."
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const res = await fetch(`${url}/rest/v1/Category?select=id&limit=1`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    })
    const body = await res.text()
    return NextResponse.json({ key, url, status: res.status, body: body.slice(0, 500) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
