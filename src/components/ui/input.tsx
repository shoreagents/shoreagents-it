import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-sidebar-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sidebar dark:text-sidebar-foreground dark:border-border dark:placeholder:text-sidebar-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
