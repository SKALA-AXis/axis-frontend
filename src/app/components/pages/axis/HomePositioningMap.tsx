import type { PositioningPoint, PositioningTone } from './types';

function getPositioningToneStyle(tone: PositioningTone) {
  switch (tone) {
    case 'accent':
      return {
        bubble: 'rgba(220,90,36,0.24)',
        border: 'rgba(220,90,36,0.72)',
        glow: 'rgba(220,90,36,0.18)',
        text: 'var(--axis-accent-strong)',
      };
    case 'company':
      return {
        bubble: 'rgba(74,120,255,0.18)',
        border: 'rgba(74,120,255,0.58)',
        glow: 'rgba(74,120,255,0.18)',
        text: 'var(--axis-graph-company)',
      };
    case 'infra':
      return {
        bubble: 'rgba(136,94,255,0.18)',
        border: 'rgba(136,94,255,0.56)',
        glow: 'rgba(136,94,255,0.16)',
        text: 'var(--axis-graph-infra)',
      };
    case 'security':
      return {
        bubble: 'rgba(55,161,124,0.18)',
        border: 'rgba(55,161,124,0.56)',
        glow: 'rgba(55,161,124,0.16)',
        text: 'var(--axis-success)',
      };
    case 'deal':
      return {
        bubble: 'rgba(203,146,62,0.18)',
        border: 'rgba(203,146,62,0.56)',
        glow: 'rgba(203,146,62,0.16)',
        text: 'var(--axis-graph-deal)',
      };
    case 'success':
      return {
        bubble: 'rgba(59,143,160,0.18)',
        border: 'rgba(59,143,160,0.56)',
        glow: 'rgba(59,143,160,0.16)',
        text: 'var(--axis-success)',
      };
  }
}

export function HomePositioningMap({
  points,
  selectedName,
  onSelect,
}: {
  points: readonly PositioningPoint[];
  selectedName: string | null;
  onSelect: (pointName: string) => void;
}) {
  const minX = 0;
  const maxX = 100;
  const minY = 0;
  const maxY = 100;
  const averageX = 58.8;
  const averageY = 63.2;
  const plotLeft = 74;
  const plotTop = 30;
  const plotWidth = 620;
  const plotHeight = 270;
  const plotRight = plotLeft + plotWidth;
  const plotBottom = plotTop + plotHeight;
  const xTicks = [0, 25, 50, 75, 100];
  const yTicks = [0, 25, 50, 75, 100];
  const xScale = (value: number) => plotLeft + ((value - minX) / (maxX - minX)) * plotWidth;
  const yScale = (value: number) => plotBottom - ((value - minY) / (maxY - minY)) * plotHeight;
  const averageXBadgeWidth = 150;
  const averageYBadgeWidth = 156;
  const averageXBadgeX = xScale(averageX) - averageXBadgeWidth / 2;
  const averageYBadgeX = plotLeft + 16;
  const averageYBadgeY = yScale(averageY) - 16;

  return (
    <svg viewBox="0 0 760 360" className="h-[360px] w-full overflow-visible">
      <defs>
        <linearGradient id="home-position-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffaf3" />
          <stop offset="55%" stopColor="#f7f0e5" />
          <stop offset="100%" stopColor="#f4ede3" />
        </linearGradient>
        <filter id="home-position-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x={plotLeft} y={plotTop} width={plotWidth} height={plotHeight} fill="rgba(255,255,255,0.58)" stroke="rgba(26,26,31,0.12)" />

      <rect x={plotLeft} y={plotTop} width={xScale(averageX) - plotLeft} height={yScale(averageY) - plotTop} fill="rgba(90,107,87,0.07)" />
      <rect x={xScale(averageX)} y={plotTop} width={plotRight - xScale(averageX)} height={yScale(averageY) - plotTop} fill="rgba(220,90,36,0.08)" />
      <rect x={plotLeft} y={yScale(averageY)} width={xScale(averageX) - plotLeft} height={plotBottom - yScale(averageY)} fill="rgba(107,107,115,0.06)" />
      <rect x={xScale(averageX)} y={yScale(averageY)} width={plotRight - xScale(averageX)} height={plotBottom - yScale(averageY)} fill="rgba(236,163,65,0.10)" />

      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line x1={plotLeft} y1={yScale(tick)} x2={plotRight} y2={yScale(tick)} stroke="rgba(26,26,31,0.08)" />
          <text x={plotLeft - 16} y={yScale(tick) + 4} fill="var(--axis-muted)" fontSize="12" textAnchor="end">{tick}</text>
        </g>
      ))}
      {xTicks.map((tick) => (
        <g key={`x-${tick}`}>
          <line x1={xScale(tick)} y1={plotTop} x2={xScale(tick)} y2={plotBottom} stroke="rgba(26,26,31,0.08)" />
          <text x={xScale(tick)} y={plotBottom + 24} fill="var(--axis-muted)" fontSize="12" textAnchor="middle">{tick.toLocaleString('ko-KR')}</text>
        </g>
      ))}

      <line x1={xScale(averageX)} y1={plotTop} x2={xScale(averageX)} y2={plotBottom} stroke="rgba(220,90,36,0.44)" strokeDasharray="4 4" />
      <line x1={plotLeft} y1={yScale(averageY)} x2={plotRight} y2={yScale(averageY)} stroke="rgba(90,107,87,0.44)" strokeDasharray="4 4" />

      <text x="14" y="24" fill="var(--axis-ink)" fontSize="15" fontWeight="700">시장 영향력</text>
      <text x="18" y="58" fill="var(--axis-accent-strong)" fontSize="12" fontWeight="700">높음</text>
      <text x="18" y={plotBottom + 20} fill="var(--axis-muted)" fontSize="12" fontWeight="700">낮음</text>
      <text x={plotLeft + plotWidth / 2} y="347" fill="var(--axis-ink)" fontSize="15" fontWeight="700" textAnchor="middle">사업 실행력</text>
      <text x={plotLeft} y="338" fill="var(--axis-muted)" fontSize="12" fontWeight="700">낮음</text>
      <text x={plotRight} y="338" fill="var(--axis-accent-strong)" fontSize="12" fontWeight="700" textAnchor="end">높음</text>

      <rect x={averageXBadgeX} y="10" width={averageXBadgeWidth} height="28" rx="14" fill="rgba(255,255,255,0.92)" stroke="rgba(26,26,31,0.10)" />
      <text x={averageXBadgeX + averageXBadgeWidth / 2} y="29" fill="var(--axis-ink)" fontSize="12" fontWeight="700" textAnchor="middle">평균 실행력: {averageX}</text>
      <rect x={averageYBadgeX} y={averageYBadgeY} width={averageYBadgeWidth} height="28" rx="14" fill="rgba(255,255,255,0.92)" stroke="rgba(26,26,31,0.10)" />
      <text x={averageYBadgeX + averageYBadgeWidth / 2} y={averageYBadgeY + 19} fill="var(--axis-ink)" fontSize="12" fontWeight="700" textAnchor="middle">평균 영향력: {averageY}</text>

      <text x={plotLeft + 16} y={52} fill="var(--axis-success)" fontSize="13" fontWeight="800">이슈 선도군</text>
      <text x={plotLeft + 16} y={68} fill="var(--axis-body)" fontSize="9.5" fontWeight="600">시장 반응은 크지만 실행 검증은 더 필요</text>
      <text x={plotRight - 16} y={48} fill="var(--axis-accent-strong)" fontSize="13" fontWeight="800" textAnchor="end">시장 주도군</text>
      <text x={plotRight - 16} y={64} fill="var(--axis-body)" fontSize="9.5" fontWeight="600" textAnchor="end">실행력·영향력 동시 확보</text>
      <text x={plotLeft + 16} y={plotBottom - 22} fill="var(--axis-muted)" fontSize="13" fontWeight="800">관찰 구간</text>
      <text x={plotLeft + 16} y={plotBottom - 8} fill="var(--axis-body)" fontSize="9.5" fontWeight="600">실행력과 영향력 모두 제한적</text>
      <text x={plotRight - 16} y={plotBottom - 22} fill="var(--axis-warning)" fontSize="13" fontWeight="800" textAnchor="end">실행 잠재군</text>
      <text x={plotRight - 16} y={plotBottom - 8} fill="var(--axis-body)" fontSize="9.5" fontWeight="600" textAnchor="end">실행력은 있으나 반응은 약함</text>

      {points.map((point) => {
        const tone = getPositioningToneStyle(point.tone);
        const r = Math.max(10, point.size / 4.2);
        const rawCx = xScale(point.xScore);
        const rawCy = yScale(point.yScore);
        const cx = Math.min(Math.max(rawCx, plotLeft + r + 10), plotRight - r - 10);
        const cy = Math.min(Math.max(rawCy, plotTop + r + 10), plotBottom - r - 10);
        const isSelected = selectedName === point.name;

        return (
          <g
            key={point.name}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(point.name);
            }}
            className="cursor-pointer"
          >
            <circle cx={cx} cy={cy} r={r + 8} fill={tone.glow} opacity={isSelected ? '0.62' : '0.38'} />
            <circle cx={cx} cy={cy} r={r} fill={tone.bubble} stroke={tone.border} strokeWidth={isSelected ? '3' : '2'} filter="url(#home-position-glow)" />
            <text
              x={cx}
              y={cy + 4}
              fill="var(--axis-ink)"
              fontSize={point.shortLabel.length >= 3 ? '10' : '11'}
              fontWeight="800"
              textAnchor="middle"
            >
              {point.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
