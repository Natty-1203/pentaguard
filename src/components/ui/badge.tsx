import * as React from "react"
import { cn } from "@/src/lib/utils"

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80",
    success: "border-transparent bg-green-100 text-green-700",
    warning: "border-transparent bg-amber-100 text-amber-700",
    danger: "border-transparent bg-red-100 text-red-700",
    info: "border-transparent bg-blue-100 text-blue-700",
    outline: "text-gray-950",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
