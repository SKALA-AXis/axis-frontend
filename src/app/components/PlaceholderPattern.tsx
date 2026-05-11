/**
 * PlaceholderPattern — 이미지 없는 카드의 시각 자산 (§18.2)
 * Peer 별 abstract gradient + 반복 도트 패턴 + 워터마크.
 */
import { cn } from './ui/utils';

const peerGradients: Record<string, string> = {
  // 코퍼레이트 컬러 기반
  samsung_sds:      'from-[#1428A0] via-[#3B4DC5] to-[#7A87E0]',
  lg_cns:           'from-[#A50034] via-[#C73018] to-[#DC5A24]',
  hyundai_autoever: 'from-[#002C5F] via-[#0E5C9A] to-[#5891C6]',
  posco_dx:         'from-[#005AAB] via-[#3F8DCF] to-[#83BFE9]',
  sk_ax:            'from-[#EA002C] via-[#DC5A24] to-[#E0822F]',  // SK 시그니처
  default:          'from-cream via-sunshine-300 to-sunshine-500',
};

const peerLabels: Record<string, string> = {
  samsung_sds:      'SAMSUNG SDS',
  lg_cns:           'LG CNS',
  hyundai_autoever: 'HYUNDAI AUTOEVER',
  posco_dx:         'POSCO DX',
  sk_ax:            'SK AX',
};

interface PlaceholderPatternProps {
  peer: string;
  ratio?: '4/3' | '16/9' | '1/1' | '3/2';
  className?: string;
  showLabel?: boolean;  // 작은 thumbnail 에선 false 권장 (잘림 방지)
}

export function PlaceholderPattern({ peer, ratio = '4/3', className, showLabel = true }: PlaceholderPatternProps) {
  const gradient = peerGradients[peer] || peerGradients.default;
  const label = peerLabels[peer] || peer.toUpperCase();
  const aspectClass =
    ratio === '16/9' ? 'aspect-[16/9]' :
    ratio === '1/1' ? 'aspect-square' :
    ratio === '3/2' ? 'aspect-[3/2]' :
    'aspect-[4/3]';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-gradient-to-br',
        gradient,
        aspectClass,
        className,
      )}
    >
      {/* 추상 도트 패턴 */}
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <pattern id={`p-${peer}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.4" />
            <circle cx="0" cy="0" r="0.8" fill="white" opacity="0.3" />
            <circle cx="40" cy="40" r="0.8" fill="white" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#p-${peer})`} />
      </svg>

      {/* peer 약자 워터마크 — showLabel 시에만 (작은 thumbnail 에선 숨김) */}
      {showLabel && (
        <div className="absolute bottom-3 right-4 text-white/60 text-caption-bold tracking-wider">
          {label}
        </div>
      )}
    </div>
  );
}
