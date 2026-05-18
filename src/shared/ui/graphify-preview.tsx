import { ExecutiveBadge } from '../../app/components/executive/ExecutiveSystem';

/**
 * 데모/티저 용도의 정적 SVG 노드 그래프 — "Graphify ready" 마케팅 미리보기.
 * Home 대시보드와 Mixer 결과 미리보기에서 공유.
 *
 * 실 데이터 그래프 (KeywordGraphView) 와는 별개. 정적 4 노드 / 4 엣지.
 */
export function GraphifyPreview({ large = false }: { large?: boolean }) {
  const nodes = [
    { id: 'today', label: 'Today', x: 160, y: 96, r: 34, color: 'var(--axis-graph-ax)' },
    { id: 'ax', label: 'AX', x: 68, y: 174, r: 24, color: 'var(--axis-graph-security)' },
    { id: 'dart', label: 'DART', x: 260, y: 172, r: 22, color: 'var(--axis-graph-infra)' },
    { id: 'deal', label: '수주', x: 190, y: 220, r: 18, color: 'var(--axis-graph-deal)' },
  ];
  const links = [
    ['today', 'ax'],
    ['today', 'dart'],
    ['today', 'deal'],
    ['ax', 'deal'],
  ];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--axis-muted)]">Graphify ready</span>
        <ExecutiveBadge tone="accent">관계 시각화</ExecutiveBadge>
      </div>
      <svg viewBox="0 0 320 280" className={`${large ? 'h-[270px]' : 'h-[154px]'} w-full`} role="img" aria-label="오늘 인사이트 관계 그래프 미리보기">
        {links.map(([sourceId, targetId]) => {
          const source = nodeMap.get(sourceId);
          const target = nodeMap.get(targetId);
          if (!source || !target) return null;
          return (
            <line
              key={`${sourceId}-${targetId}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="var(--axis-graph-edge)"
              strokeOpacity="0.86"
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} fillOpacity="0.88" />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
