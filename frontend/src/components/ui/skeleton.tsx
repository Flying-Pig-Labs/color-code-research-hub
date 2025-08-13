/**
 * @fileoverview UI component from the Color Code Research Hub design system.
 * Built with Radix UI primitives and Tailwind CSS for consistent styling.
 * @author Color Code Research Hub Team - UI Components
 * @version 1.0.0
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
