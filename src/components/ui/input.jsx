import * as React from "react"

import { cn } from "@/lib/utils"

/** @type {React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>} */
const Input = React.forwardRef(/** @type {React.ForwardRefRenderFunction<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>} */ (({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-foreground shadow-sm transition-all placeholder:text-gray/50 focus-visible:outline-none focus-visible:bg-white focus-visible:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy/8 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
}))
Input.displayName = "Input"

export { Input }