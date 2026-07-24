interface AvatarProps {
  src?: string | null
  name: string
  size?: "sm" | "md" | "lg"
}

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-lg" }
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center`}>
      {initials}
    </div>
  )
}
