/**
 * SkLogo — SK 그룹 공식 로고 (PNG, public/sk-logo.png)
 * 라이트/다크 환경 모두 동일한 PNG 사용.
 */
import { cn } from '../ui/utils';

interface SkLogoProps {
  className?: string;
}

export function SkLogo({ className }: SkLogoProps) {
  return (
    <img
      src="/sk-logo.png"
      alt="SK"
      className={cn('shrink-0 object-contain', className)}
      aria-label="SK"
    />
  );
}
