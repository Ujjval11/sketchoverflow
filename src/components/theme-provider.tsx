"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: "system", setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored) setThemeState(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") { root.classList.add("dark") } else if (theme === "light") { root.classList.remove("dark") }
    else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      if (mq.matches) root.classList.add("dark"); else root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
