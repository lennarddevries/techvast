import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border-border text-foreground",
        accent:
          "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
        available:
          "border-transparent bg-[oklch(0.62_0.17_155/0.15)] text-[oklch(0.45_0.15_155)] dark:bg-[oklch(0.62_0.17_155/0.2)] dark:text-[oklch(0.72_0.15_155)]",
        unavailable: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
