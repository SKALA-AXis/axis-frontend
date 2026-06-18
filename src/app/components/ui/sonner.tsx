"use client";

/*
 * 작성일: 2026-04-23
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-23 안가은 — 초기 프론트엔드 셋업으로 sonner(Toaster) UI 컴포넌트 추가
 */
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
