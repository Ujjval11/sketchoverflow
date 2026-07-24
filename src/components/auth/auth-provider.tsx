"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function fetchUserFromAPI() {
    try {
      const r = await fetch("/api/auth/me")
      if (!r.ok) return null
      const d = await r.json()
      return d.user
    } catch { return null }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = await fetchUserFromAPI()
        if (u) setUser(u)
        else setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.email!,
          avatarUrl: session.user.user_metadata?.avatar_url || null,
          role: null,
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = await fetchUserFromAPI()
        if (u) setUser(u)
        else setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.email!,
          avatarUrl: session.user.user_metadata?.avatar_url || null,
          role: null,
        })
      } else { setUser(null) }
      setLoading(false)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
