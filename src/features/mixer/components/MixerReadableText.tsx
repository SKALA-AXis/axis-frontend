import { sanitizeMixerDisplayText } from '../lib/mixerText';
import { splitMixerReadableText } from '../lib/mixerSentence';

// Mixer 표시 텍스트 렌더 표현 컴포넌트 (refactoring P2/stage3). MixerView 에서 그대로 옮긴 것.

/** 정제된 표시 텍스트만 렌더(잡토큰/중복 제거 후). */
export function HighlightedMixerText({ text }: { text: string }) {
  return <>{sanitizeMixerDisplayText(text)}</>;
}

/** 텍스트를 완결 문장 단위(불릿)로 렌더. 표시할 문장 없으면 렌더 안 함. */
export function MixerReadableText({
  text,
  maxItems = 3,
  className = '',
  compact = false,
}: {
  text: string;
  maxItems?: number;
  className?: string;
  compact?: boolean;
}) {
  const items = splitMixerReadableText(text, maxItems);
  if (items.length === 0) return null;
  return (
    <div className={`grid ${compact ? 'gap-1.5' : 'gap-2'} ${className}`}>
      {items.map((item, index) => (
        <p
          key={`${item}-${index}`}
          className={`flex gap-2 ${compact ? 'text-xs leading-5' : 'text-sm leading-6'} text-[var(--axis-body)]`}
        >
          <span className="mt-[0.48rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--axis-accent)]" />
          <span>
            <HighlightedMixerText text={item} />
          </span>
        </p>
      ))}
    </div>
  );
}
