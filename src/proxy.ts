import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard", "/progress", "/settings", "/admin"]
const authRoutes = ["/login", "/register"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))
  const isAuth = authRoutes.some((r) => pathname.startsWith(r))

  const redirectParam = request.nextUrl.searchParams.get("redirect")

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url)
    if (pathname !== "/login" && pathname !== "/register") {
      loginUrl.searchParams.set("redirect", pathname + (redirectParam ? `?redirect=${redirectParam}` : ""))
    }
    return NextResponse.redirect(loginUrl)
  }

  if (isAuth && user) {
    return NextResponse.redirect(new URL(redirectParam || "/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
