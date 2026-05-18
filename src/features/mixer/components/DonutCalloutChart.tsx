export type DonutCalloutDatum = {
  name: string;
  value: number;
  color: string;
};

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function donutArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const outerStart = polarPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = polarPoint(cx, cy, outerRadius, endAngle);
  const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);
  const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/**
 * 도넛 차트 + 콜아웃 라벨 — Mixer 결과의 카드/peer/sector 분포 시각화.
 * 라벨이 차트 바깥에 콜아웃 라인과 함께 표시됨.
 */
export function DonutCalloutChart({ data }: { data: DonutCalloutDatum[] }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  let cursor = -Math.PI / 2;
  const cx = 180;
  const cy = 118;
  const outerRadius = 68;
  const innerRadius = 26;
  const segments = data.map((item, index) => {
    const startAngle = cursor;
    const angle = (item.value / total) * Math.PI * 2;
    cursor += angle;
    const endAngle = cursor;
    const midAngle = startAngle + angle / 2;
    const side = Math.cos(midAngle) >= 0 ? 'right' : 'left';
    const anchor = polarPoint(cx, cy, outerRadius + 2, midAngle);
    const elbow = polarPoint(cx, cy, outerRadius + 18, midAngle);
    const y = Math.min(202, Math.max(28, elbow.y + (index % 2 === 0 ? -2 : 8)));
    const labelX = side === 'right' ? 300 : 60;
    const lineEndX = side === 'right' ? labelX - 24 : labelX + 24;
    return {
      ...item,
      startAngle,
      endAngle,
      anchor,
      elbow: { ...elbow, y },
      labelX,
      lineEndX,
      side,
      percentage: Math.round((item.value / total) * 100),
    };
  });

  return (
    <svg viewBox="0 0 360 236" className="h-full w-full overflow-visible" role="img" aria-label="선택 비율 도넛 차트">
      <g>
        {segments.map((item) => (
          <path
            key={item.name}
            d={donutArcPath(cx, cy, innerRadius, outerRadius, item.startAngle, item.endAngle)}
            fill={item.color}
            opacity="0.9"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={innerRadius - 1} fill="var(--axis-canvas)" />
      {segments.map((item) => (
        <g key={`label-${item.name}`}>
          <path
            d={`M ${item.anchor.x} ${item.anchor.y} L ${item.elbow.x} ${item.elbow.y} L ${item.lineEndX} ${item.elbow.y}`}
            fill="none"
            stroke="var(--axis-muted)"
            strokeOpacity="0.72"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <text
            x={item.labelX}
            y={item.elbow.y - 4}
            textAnchor={item.side === 'right' ? 'end' : 'start'}
            className="fill-[var(--axis-ink)] text-[13px] font-bold"
          >
            {item.name}
          </text>
          <text
            x={item.labelX}
            y={item.elbow.y + 14}
            textAnchor={item.side === 'right' ? 'end' : 'start'}
            className="fill-[var(--axis-muted)] text-[12px] font-semibold"
          >
            {item.value} · {item.percentage}%
          </text>
        </g>
      ))}
    </svg>
  );
}
