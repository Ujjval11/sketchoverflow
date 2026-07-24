import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import "./globals.css"

export const metadata: Metadata = {
  title: "SketchOverflow - Practice Every Day. Draw Like a Professional.",
  description: "Improve your drawing skills with timed references, challenges, and community feedback.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
