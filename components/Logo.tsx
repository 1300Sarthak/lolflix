"use client"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      aria-label="lolflix"
    >
      <span
        className={`font-extrabold uppercase tracking-wider ${sizes[size]} leading-none`}
        style={{
          color: "#E50914",
          letterSpacing: "0.04em",
          textShadow: "0 2px 8px rgba(229,9,20,0.4)",
        }}
      >
        lolflix
      </span>
    </span>
  )
}
