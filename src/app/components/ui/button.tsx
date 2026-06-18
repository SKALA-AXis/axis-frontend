/*
 * 작성일: 2026-04-23
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-23 안가은 — 프론트엔드 초기 셋업으로 컴포넌트 추가 후 화면 UI 개선
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

// Mistral button system — design-mistral-prompt.md §Phase 2
// cva variants key 보존 (default/destructive/outline/secondary/ghost/link), className 만 교체
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-btn-md transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-action focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        // button-primary: saturated orange CTA
        default: "bg-action text-white active:bg-primary-deep",
        // destructive: vermilion (위험 액션 한정)
        destructive: "bg-urgent text-white active:bg-primary-deep",
        // button-secondary: outlined
        outline: "bg-transparent text-ink border border-hairline-strong",
        // button-cream: 크림 panel 위 강조
        secondary: "bg-cream text-ink border border-beige-deep",
        // button-link: text only, primary
        ghost: "bg-transparent text-action",
        // inline link
        link: "text-action underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",     // 10x20
        sm: "h-9 px-4 py-2 text-caption",
        lg: "h-12 px-6 py-3",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
