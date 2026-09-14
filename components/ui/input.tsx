import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // h-10 rather than the stock h-8: the M-Pesa checkout asks for a phone
        // number and an email on a payment form, so the fields need to look
        // solid and be comfortably tappable.
        //
        // Fill is `bg-gray-950/60` on the black theme - a field must read as
        // recessed against the gray-900 card it sits on. The stock
        // `dark:bg-input/30` override was removed rather than left in place:
        // with two competing background utilities in one string the winner comes
        // down to Tailwind's class ordering, which is not something to leave to
        // chance on a payment input.
        "h-10 w-full min-w-0 rounded-lg border border-input bg-gray-950/60 px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
