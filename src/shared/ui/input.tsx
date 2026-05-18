import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Mistral text-input — h-11, hairline-strong border, rounded-md, focus 2px primary
        "file:text-ink placeholder:text-stone selection:bg-action selection:text-white flex h-11 w-full min-w-0 rounded-md border border-hairline-strong px-4 py-2.5 text-body-md bg-canvas outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-caption file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-action focus-visible:border-2",
        "aria-invalid:border-urgent",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
