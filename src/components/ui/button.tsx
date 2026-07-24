import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "error"
  size?: "sm" | "md" | "lg"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    const variants = {
      primary: "bg-primary text-white hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border bg-transparent hover:bg-muted",
      ghost: "bg-transparent hover:bg-muted",
      error: "bg-error text-white hover:bg-error/90",
    }
    const sizes = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" }
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
    )
  }
)
Button.displayName = "Button"
