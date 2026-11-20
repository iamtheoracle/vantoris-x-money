import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/15 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-navy text-white shadow-sm hover:bg-navy/90 active:scale-[0.98]",
        gold:
          "bg-brass text-white shadow-sm hover:bg-brass/90 active:scale-[0.98]",
        destructive:
          "bg-crimson text-white shadow-sm hover:bg-crimson/90 active:scale-[0.98]",
        outline:
          "border border-slate-200 bg-white text-foreground shadow-sm hover:bg-slate-50 hover:border-navy/20 active:scale-[0.98]",
        secondary:
          "bg-slate-100 text-foreground shadow-sm hover:bg-slate-200 active:scale-[0.98]",
        ghost: "hover:bg-slate-100 hover:text-foreground active:scale-[0.98]",
        link: "text-navy underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** @type {React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default'|'gold'|'destructive'|'outline'|'secondary'|'ghost'|'link', size?: 'default'|'sm'|'lg'|'icon', asChild?: boolean } & React.RefAttributes<HTMLButtonElement>>} */
const Button = React.forwardRef(/** @type {React.ForwardRefRenderFunction<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default'|'gold'|'destructive'|'outline'|'secondary'|'ghost'|'link', size?: 'default'|'sm'|'lg'|'icon', asChild?: boolean }>} */ (({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
}))
Button.displayName = "Button"

export { Button, buttonVariants }