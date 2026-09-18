import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      suppressHydrationWarning
      className={cn(
        "flex h-11 w-full rounded-md bg-surface-2 px-3 text-sm text-fg shadow-border outline-none transition-[box-shadow] duration-[var(--motion-quick)] placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
