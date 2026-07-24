import { HTMLAttributes, forwardRef } from "react"

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`rounded-xl border border-border bg-card shadow-sm ${className}`} {...props} />
  )
)
Card.displayName = "Card"

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`px-6 py-4 border-b border-border ${className}`} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`px-6 py-4 ${className}`} {...props} />
  )
)
CardContent.displayName = "CardContent"
