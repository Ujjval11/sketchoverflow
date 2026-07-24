"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { signOut } from "@/lib/supabase/actions"
import { SITE_NAME } from "@/lib/utils/constants"
import { useState } from "react"

export function Navbar() {
  const { user, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
            <path d="M7.5 20.5 19 9"/>
            <circle cx="12" cy="12" r="10" strokeWidth="1" opacity="0.15"/>
          </svg>
          <span>{SITE_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/practice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Practice
          </Link>
          <Link href="/challenges" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Challenges
          </Link>
          <Link href="/articles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Articles
          </Link>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          {user ? (
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Account menu"
              >
                <Avatar src={user.avatarUrl} name={user.name || user.email} size="sm" />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-lg z-20 py-1">
                    <div className="px-3 py-2.5 text-sm font-medium border-b border-border truncate flex items-center gap-2">
                      <Avatar src={user.avatarUrl} name={user.name || user.email} size="sm" />
                      <span className="truncate">{user.name || user.email}</span>
                    </div>
                    <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setDropdownOpen(false)}>My Profile</Link>
                    <Link href="/dashboard" className="block px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setDropdownOpen(false)}>Dashboard</Link>
                    <Link href="/progress" className="block px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setDropdownOpen(false)}>Progress</Link>
                    <Link href="/settings" className="block px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setDropdownOpen(false)}>Settings</Link>
                    {user.role === "admin" && <Link href="/admin" className="block px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setDropdownOpen(false)}>Admin</Link>}
                    <hr className="border-border my-1" />
                    <form action={signOut}>
                      <button type="submit" className="w-full text-left px-3 py-2 text-sm text-error hover:bg-muted transition-colors font-medium">Sign Out</button>
                    </form>
                  </div>
                </>
              )}
            </div>
          ) : (
            !loading && <Link href="/login"><Button size="sm">Sign In</Button></Link>
          )}
        </nav>

        <button className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          <Link href="/practice" className="block text-sm" onClick={() => setMobileOpen(false)}>Practice</Link>
          <Link href="/challenges" className="block text-sm" onClick={() => setMobileOpen(false)}>Challenges</Link>
          <Link href="/articles" className="block text-sm" onClick={() => setMobileOpen(false)}>Articles</Link>
          {user ? (
            <>
              <div className="flex items-center gap-2 py-2 border-b border-border">
                <Avatar src={user.avatarUrl} name={user.name || user.email} size="sm" />
                <span className="text-sm font-medium truncate">{user.name || user.email}</span>
              </div>
              <Link href="/profile" className="block text-sm" onClick={() => setMobileOpen(false)}>My Profile</Link>
              <Link href="/dashboard" className="block text-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link href="/progress" className="block text-sm" onClick={() => setMobileOpen(false)}>Progress</Link>
              <Link href="/settings" className="block text-sm" onClick={() => setMobileOpen(false)}>Settings</Link>
              {user.role === "admin" && <Link href="/admin" className="block text-sm" onClick={() => setMobileOpen(false)}>Admin</Link>}
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm" className="text-error">Sign Out</Button>
              </form>
            </>
          ) : <Link href="/login" onClick={() => setMobileOpen(false)}><Button size="sm">Sign In</Button></Link>}
        </div>
      )}
    </header>
  )
}
