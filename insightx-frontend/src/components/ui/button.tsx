console.log("DEBUG: button.tsx loaded");

import * as React from "react";
import { cn } from "../../lib/utils.ts";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      default: "bg-sky-600 text-white hover:bg-sky-700 px-4 py-2",
      secondary: "bg-white text-sky-700 hover:bg-slate-100 px-4 py-2",
      ghost: "bg-transparent text-slate-700 hover:bg-slate-100 px-3 py-2",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
