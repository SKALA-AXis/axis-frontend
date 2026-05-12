import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

// Mistral badge — pill (rounded-full), caption-bold, 4×10 padding
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border-transparent px-2.5 py-1 text-caption-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-2 focus-visible:outline-action overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-action text-white",                  // badge-orange
        secondary: "bg-cream-deeper text-ink",            // badge-cream
        destructive: "bg-urgent text-white",
        outline: "text-ink border border-hairline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
