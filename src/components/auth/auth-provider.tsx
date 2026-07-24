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

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.email!,
          avatarUrl: session.user.user_metadata?.avatar_url || null,
          role: null,
        })
        fetch("/api/auth/me").then(r => r.ok && r.json()).then(d => {
          if (!cancelled && d?.user) setUser(d.user)
        }).catch(() => {})
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.email!,
          avatarUrl: session.user.user_metadata?.avatar_url || null,
          role: null,
        })
        fetch("/api/auth/me").then(r => r.ok && r.json()).then(d => {
          if (!cancelled && d?.user) setUser(d.user)
        }).catch(() => {})
      } else { setUser(null) }
      setLoading(false)
      router.refresh()
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
