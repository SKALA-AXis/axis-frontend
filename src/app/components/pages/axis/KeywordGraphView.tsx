import { type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Filter, Maximize2, Minus, Network, Plus } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as THREE from 'three';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { getDisplayDate, getExecutiveRank, getPeerLabel, getSummaryLines } from '../../../../features/card-news/mappers/cardNewsExecutive';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { useDashboard } from '../../../../features/dashboard/hooks/useDashboard';
import type { DashboardKeywordSearchPoint } from '../../../../features/dashboard/model/dashboard';
import { graphCategoryColor, graphCompanyAliases, graphEdges, graphNodes, type KeywordEdge, type KeywordNode } from '../../../../shared/mocks/keywordGraph';
import { ExecutiveBadge, ExecutiveButton, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { FilterChip, MiniStat } from './AxisPlanningShared';

type NavigateHandler = (view: string) => void;

function KeywordRelatedCardButton({ card, onOpen }: { card: CardNewsItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full min-w-0 flex-col rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)]"
    >
      <div className="relative mb-3 aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[var(--axis-radius-md)] bg-[#081324]">
        {card.coverImageUrl ? (
          <img src={card.coverImageUrl} alt={card.coverImageAlt} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
        <span className="absolute bottom-2 left-2 max-w-[calc(100%_-_16px)] truncate text-xs font-semibold text-white">{getPeerLabel(card)}</span>
      </div>
      <p className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</p>
      <h3 className="mt-1 min-h-[3.75rem] line-clamp-3 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</h3>
    </button>
  );
}

function normalizeGraphTerm(value: string) {
  return value.replace(/\s/g, '').toLowerCase();
}

function resolveCssColor(value: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const variableMatch = value.match(/^var\((--[^)]+)\)$/);
  if (!variableMatch) return value;
  return getComputedStyle(document.documentElement).getPropertyValue(variableMatch[1]).trim() || fallback;
}

function getGraphNodeDisplayRadius(node: KeywordNode, active = false) {
  const base = node.category === '기업'
    ? node.size / 3.2
    : node.size >= 22
      ? node.size / 3.8
      : node.size / 4.35;
  return base + (active ? 2.4 : 0);
}

function splitGraphLabel(label: string) {
  if (label.includes(' ') && label.length > 11) {
    const parts = label.split(' ');
    const midpoint = Math.ceil(parts.length / 2);
    return [parts.slice(0, midpoint).join(' '), parts.slice(midpoint).join(' ')];
  }
  if (label.length > 7) {
    const midpoint = Math.ceil(label.length / 2);
    return [label.slice(0, midpoint), label.slice(midpoint)];
  }
  return [label];
}

function getSpherePosition(node: KeywordNode, radius: number, index = 0) {
  if (node.id === 'sk-axis') {
    return new THREE.Vector3(0, 0, 0);
  }

  const companyAnchors: Record<string, [number, number, number]> = {
    'samsung-sds': [-0.66, 0.58, -0.46],
    'lg-cns': [0.72, 0.54, -0.34],
    'hyundai-autoever': [-0.58, -0.62, 0.48],
    'posco-dx': [0.62, -0.58, 0.50],
  };

  const anchor = companyAnchors[node.id];
  if (anchor) {
    return new THREE.Vector3(anchor[0], anchor[1], anchor[2]).normalize().multiplyScalar(radius * 0.98);
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const normalizedIndex = index + 1.5;
  const phi = Math.acos(1 - (2 * normalizedIndex) / (graphNodes.length + 2));
  const theta = normalizedIndex * goldenAngle;
  const layer = node.size >= 21 ? 0.94 : 0.58 + (index % 6) * 0.07;
  const layeredRadius = radius * Math.min(1, layer);
  return new THREE.Vector3(
    layeredRadius * Math.sin(phi) * Math.cos(theta),
    layeredRadius * Math.cos(phi),
    layeredRadius * Math.sin(phi) * Math.sin(theta),
  );
}

function KeywordSphereGraph({
  nodes,
  edges,
  selectedId,
  zoom = 1,
  fullscreen = false,
  themeRevision = 0,
  onSelectNode,
  onCloseFullscreen,
}: {
  nodes: KeywordNode[];
  edges: KeywordEdge[];
  selectedId: string;
  zoom?: number;
  fullscreen?: boolean;
  themeRevision?: number;
  onSelectNode: (nodeId: string) => void;
  onCloseFullscreen?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onSelectRef = useRef(onSelectNode);
  const groupRef = useRef<THREE.Group | null>(null);
  const rotationRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0];

  useEffect(() => {
    onSelectRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    groupRef.current?.scale.setScalar(zoom);
  }, [zoom]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 1200);
    camera.position.set(0, 0, fullscreen ? 540 : 470);

    const group = new THREE.Group();
    const preservedRotation = rotationRef.current;
    group.rotation.x = preservedRotation?.x ?? (fullscreen ? 0.18 : 0.12);
    group.rotation.y = preservedRotation?.y ?? 0;
    group.rotation.z = preservedRotation?.z ?? 0;
    group.scale.setScalar(zoom);
    groupRef.current = group;
    scene.add(group);

    const radius = fullscreen ? 214 : 146;
    const nodePositions = new Map<string, THREE.Vector3>();
    nodes.forEach((node, index) => nodePositions.set(node.id, getSpherePosition(node, radius, index)));
    const isDarkMode = document.documentElement.classList.contains('dark');

    group.add(new THREE.AmbientLight(0xffffff, 1.4));
    const keyLight = new THREE.PointLight(0xffffff, 1.2);
    keyLight.position.set(120, 180, 260);
    group.add(keyLight);

    edges.forEach((edge) => {
      const source = nodePositions.get(edge.source);
      const target = nodePositions.get(edge.target);
      if (!source || !target) return;
      const active = selectedId === edge.source || selectedId === edge.target;
      const geometry = new THREE.BufferGeometry().setFromPoints([source, target]);
      const material = new THREE.LineBasicMaterial({
        color: active
          ? resolveCssColor('var(--axis-graph-active-edge)', '#DC5A24')
          : (isDarkMode ? '#F5E7D2' : resolveCssColor('var(--axis-graph-edge)', '#8D8173')),
        transparent: true,
        opacity: active ? 0.92 : (isDarkMode ? 0.62 : 0.5),
        depthTest: false,
        depthWrite: false,
      });
      group.add(new THREE.Line(geometry, material));
    });

    const nodeMeshes: THREE.Mesh[] = [];
    const labelColor = isDarkMode ? '#FFF8EC' : resolveCssColor('var(--axis-ink)', '#1A1A1F');
    const labelStroke = isDarkMode ? 'rgba(4,5,8,0.96)' : 'rgba(255,255,255,0.98)';
    const createLabelSprite = (label: string, active: boolean, category: KeywordNode['category']) => {
      const labelCanvas = document.createElement('canvas');
      const context = labelCanvas.getContext('2d');
      const labelLines = splitGraphLabel(label);
      const fontSize = category === '기업' ? (active ? 36 : 31) : active ? 29 : 23;
      const lineHeight = fontSize * 1.05;
      const longestLine = labelLines.reduce((longest, line) => Math.max(longest, line.length), 0);
      const width = Math.max(120, longestLine * fontSize * 0.82 + 28);
      const height = Math.max(48, labelLines.length * lineHeight + 18);
      labelCanvas.width = width;
      labelCanvas.height = height;
      if (context) {
        context.font = `700 ${fontSize}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = labelColor;
        context.strokeStyle = labelStroke;
        context.lineWidth = isDarkMode ? 7 : 6;
        labelLines.forEach((line, index) => {
          const y = height / 2 + (index - (labelLines.length - 1) / 2) * lineHeight;
          context.strokeText(line, width / 2, y);
          context.fillText(line, width / 2, y);
        });
      }
      const texture = new THREE.CanvasTexture(labelCanvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: active ? 0.98 : 0.82,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(width / (fullscreen ? 4.7 : 5.2), height / (fullscreen ? 4.7 : 5.2), 1);
      return sprite;
    };

    nodes.forEach((node) => {
      const position = nodePositions.get(node.id);
      if (!position) return;
      const active = node.id === selectedId;
      const color = resolveCssColor(graphCategoryColor[node.category], '#D48362');
      const visibleRadius = getGraphNodeDisplayRadius(node, active);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(4.8, visibleRadius), 24, 16),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: active ? 0.24 : 0.08,
          roughness: 0.42,
          metalness: 0.08,
        }),
      );
      mesh.position.copy(position);
      mesh.userData.nodeId = node.id;
      group.add(mesh);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(visibleRadius + 8, node.category === '기업' ? 20 : 14), 18, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hitMesh.position.copy(position);
      hitMesh.userData.nodeId = node.id;
      nodeMeshes.push(hitMesh);
      group.add(hitMesh);

      const labelSprite = createLabelSprite(node.label, active || node.category === '기업', node.category);
      labelSprite.position.copy(position);
      group.add(labelSprite);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragState = { dragging: false, lastX: 0, lastY: 0, moved: false };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (dragState.dragging) {
        const dx = event.clientX - dragState.lastX;
        const dy = event.clientY - dragState.lastY;
        group.rotation.y += dx * 0.006;
        group.rotation.x += dy * 0.004;
        rotationRef.current = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
        dragState.lastX = event.clientX;
        dragState.lastY = event.clientY;
        dragState.moved = dragState.moved || Math.abs(dx) + Math.abs(dy) > 2;
        canvas.style.cursor = 'grabbing';
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      canvas.style.cursor = raycaster.intersectObjects(nodeMeshes, false).length > 0 ? 'pointer' : 'default';
    };

    const handlePointerDown = (event: PointerEvent) => {
      dragState.dragging = true;
      dragState.lastX = event.clientX;
      dragState.lastY = event.clientY;
      dragState.moved = false;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const handlePointerUp = (event: PointerEvent) => {
      dragState.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      canvas.style.cursor = 'default';
    };

    const handleClick = (event: MouseEvent) => {
      if (dragState.moved) {
        dragState.moved = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObjects(nodeMeshes, false);
      const nodeId = hit?.object.userData.nodeId;
      if (typeof nodeId === 'string') onSelectRef.current(nodeId);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);
    canvas.addEventListener('click', handleClick);
    resize();

    let frameId = 0;
    const animate = () => {
      if (!dragState.dragging) {
        group.rotation.y += fullscreen ? 0.0014 : 0.001;
        rotationRef.current = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
      }
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      canvas.removeEventListener('click', handleClick);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        }
        if (object instanceof THREE.Sprite) {
          object.material.map?.dispose();
          object.material.dispose();
        }
      });
      rotationRef.current = { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z };
      renderer.dispose();
      groupRef.current = null;
    };
  }, [edges, fullscreen, nodes, selectedId, themeRevision]);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_50%_38%,var(--axis-surface-muted),var(--axis-surface-soft)_52%,var(--axis-canvas))] ${
        fullscreen ? 'h-full w-full' : 'h-full'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="360도 회전 키워드 구 그래프" />
      <div data-keyword-sphere-info className="pointer-events-none absolute left-5 top-5 hidden rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/90 px-4 py-3 shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] backdrop-blur md:block">
        <p className="axis-kicker">3D keyword sphere</p>
        <h2 className="mt-1 text-base font-semibold text-[var(--axis-ink)]">{selectedNode?.label ?? '키워드 그래프'}</h2>
      </div>
      {fullscreen && onCloseFullscreen ? (
        <button
          type="button"
          onClick={onCloseFullscreen}
          className="absolute right-5 top-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)]"
        >
          전체화면 닫기
        </button>
      ) : null}
      <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
        {(['기업', 'AX', '보안', '인프라', '수주'] as const).map((item) => (
          <span key={item} className="inline-flex items-center gap-2 rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/86 px-3 py-1.5 text-xs font-semibold text-[var(--axis-body)] backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: graphCategoryColor[item] }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function KeywordGraphView({
  onNavigate,
  bookmarkedIds = [],
  onToggleBookmark,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
}) {
  const { dashboard } = useDashboard();
  const { cards } = useCardNews();
  const [selectedId, setSelectedId] = useState('sk-axis');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [category, setCategory] = useState<KeywordNode['category'] | '전체'>('전체');
  const [scale, setScale] = useState(1);
  const [graphPan, setGraphPan] = useState({ x: 0, y: 0 });
  const graphPanRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const [detailOpen, setDetailOpen] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const [keywordOverlayOpen, setKeywordOverlayOpen] = useState(false);
  const [overlayPage, setOverlayPage] = useState(0);
  const [graphMode, setGraphMode] = useState<'2d' | '3d'>('3d');
  const [graphFullscreenMode, setGraphFullscreenMode] = useState<'2d' | '3d' | null>(null);
  const [keywordDetailCardId, setKeywordDetailCardId] = useState<string | null>(null);
  const [keywordDetailSlideIndex, setKeywordDetailSlideIndex] = useState(0);
  const [themeRevision, setThemeRevision] = useState(0);

  const visibleNodes = useMemo(() => graphNodes.filter((node) => category === '전체' || node.category === category), [category]);
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    return graphEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  }, [visibleNodes]);
  const selected = graphNodes.find((node) => node.id === selectedId) ?? graphNodes[0];
  const trendData: DashboardKeywordSearchPoint[] = dashboard?.keywordSearchPoints ?? [];
  const rankedCardsForKeyword = useMemo(() => getExecutiveRank(cards), [cards]);
  const overlayCardsAll = useMemo(() => {
    const normalizedTerms = [selected.label, selected.category, selected.sourceType, ...(graphCompanyAliases[selected.id] ?? [])]
      .filter(Boolean)
      .map(normalizeGraphTerm);
    const matched = rankedCardsForKeyword.filter((card) => {
      const haystack = normalizeGraphTerm([
        card.title,
        getPeerLabel(card),
        card.category,
        card.category_label,
        card.subtitle,
        card.sector,
        ...(card.summary_lines ?? card.summary),
        ...(card.insights ?? []),
      ]
        .filter(Boolean)
        .join(' '));
      return normalizedTerms.some((term) => haystack.includes(term) || term.includes(normalizeGraphTerm(card.category_label ?? card.category)));
    });
    return matched.length > 0 ? matched : rankedCardsForKeyword;
  }, [rankedCardsForKeyword, selected.category, selected.id, selected.label, selected.sourceType]);
  const overlayPageSize = 3;
  const overlayPageCount = Math.max(1, Math.ceil(overlayCardsAll.length / overlayPageSize));
  const safeOverlayPage = ((overlayPage % overlayPageCount) + overlayPageCount) % overlayPageCount;
  const overlayCards = overlayCardsAll.slice(safeOverlayPage * overlayPageSize, safeOverlayPage * overlayPageSize + overlayPageSize);
  const keywordDetailCard = keywordDetailCardId ? cards.find((card) => card.id === keywordDetailCardId) ?? null : null;

  useEffect(() => {
    setOverlayPage(0);
  }, [selectedId]);

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return undefined;

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'class')) {
        setThemeRevision((current) => current + 1);
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const getNode = (id: string) => graphNodes.find((node) => node.id === id) ?? graphNodes[0];
  const selectGraphNode = (nodeId: string) => {
    setSelectedId(nodeId);
    if (window.matchMedia('(min-width: 1280px)').matches) {
      setDetailOpen(true);
    }
    setKeywordOverlayOpen(true);
  };
  const handleGraphPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('g[role="button"]')) return;
    graphPanRef.current = { dragging: true, lastX: event.clientX, lastY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleGraphPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!graphPanRef.current.dragging) return;
    const dx = event.clientX - graphPanRef.current.lastX;
    const dy = event.clientY - graphPanRef.current.lastY;
    graphPanRef.current.lastX = event.clientX;
    graphPanRef.current.lastY = event.clientY;
    setGraphPan((current) => ({ x: current.x + dx, y: current.y + dy }));
  };
  const handleGraphPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    graphPanRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleGraphWheel = (event: ReactWheelEvent<HTMLElement>) => {
    event.preventDefault();
    const nextDelta = event.deltaY > 0 ? -0.08 : 0.08;
    setScale((current) => Math.min(1.45, Math.max(0.75, Number((current + nextDelta).toFixed(2)))));
  };
  const renderKeywordSvg = (fullscreen = false) => (
    <svg
      viewBox="0 0 900 560"
      className={`h-full w-full cursor-grab active:cursor-grabbing ${fullscreen ? 'bg-[var(--axis-surface-soft)]' : ''}`}
      role="img"
      aria-label="키워드 관계 그래프"
      style={{ touchAction: 'none' }}
      onPointerDown={handleGraphPointerDown}
      onPointerMove={handleGraphPointerMove}
      onPointerUp={handleGraphPointerUp}
      onPointerLeave={handleGraphPointerUp}
    >
      <g transform={`translate(${graphPan.x + 450 - 450 * scale} ${graphPan.y + 280 - 280 * scale}) scale(${scale})`}>
        {visibleEdges.map((edge) => {
          const source = getNode(edge.source);
          const target = getNode(edge.target);
          const active = selectedId === edge.source || selectedId === edge.target || hoveredId === edge.source || hoveredId === edge.target;
          return (
            <line
              key={`${edge.source}-${edge.target}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={active ? 'var(--axis-graph-active-edge)' : 'var(--axis-graph-edge)'}
              strokeWidth={edge.weight}
              strokeLinecap="round"
            />
          );
        })}
        {visibleNodes.map((node) => {
          const active = selectedId === node.id || hoveredId === node.id;
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              onClick={() => selectGraphNode(node.id)}
              onDoubleClick={() => onNavigate(node.sourceType === 'cardnews' ? 'issues' : 'briefings')}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size + (active ? 5 : 0)}
                fill={graphCategoryColor[node.category]}
                fillOpacity={active ? 0.95 : 0.78}
                stroke={active ? 'var(--axis-ink)' : 'var(--axis-canvas)'}
                strokeWidth={active ? 3 : 2}
              />
              <text
                x={node.x}
                y={node.y + node.size + 18}
                textAnchor="middle"
                fontSize={active ? 15 : 13}
                fontWeight={active ? 700 : 600}
                fill="var(--axis-ink)"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );

  return (
    <ExecutivePage>
      <ExecutiveContainer className="max-w-none px-3 pb-3 pt-2 sm:px-4 lg:px-4">
        <section className="axis-panel-flat min-h-0 overflow-hidden">
          <header className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-end">
            <h1 className="sr-only">키워드 그래프</h1>
            <div data-guide="keyword-controls" className="flex flex-wrap gap-2">
              <div data-guide="keyword-filter" className="flex flex-wrap gap-2">
              <FilterChip active={category === '전체'} onClick={() => setCategory('전체')}>전체</FilterChip>
              {(['기업', 'AX', '보안', '인프라', '수주'] as const).map((item) => (
                <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</FilterChip>
              ))}
              </div>
              <ExecutiveButton variant="secondary" icon={<Minus size={15} />} onClick={() => setScale((current) => Math.max(0.75, Number((current - 0.1).toFixed(2))))}>축소</ExecutiveButton>
              <span className="inline-flex min-h-10 items-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)]">
                {Math.round(scale * 100)}%
              </span>
              <ExecutiveButton variant="secondary" icon={<Plus size={15} />} onClick={() => setScale((current) => Math.min(1.45, Number((current + 0.1).toFixed(2))))}>확대</ExecutiveButton>
              <ExecutiveButton
                variant={graphMode === '3d' ? 'primary' : 'secondary'}
                icon={<Box size={15} />}
                onClick={() => setGraphMode((mode) => (mode === '3d' ? '2d' : '3d'))}
              >
                3D 보기
              </ExecutiveButton>
              <ExecutiveButton
                variant="secondary"
                icon={<Maximize2 size={15} />}
                onClick={() => setGraphFullscreenMode(graphMode)}
              >
                전체화면
              </ExecutiveButton>
            </div>
          </header>

          <div className="grid h-[calc(100dvh-156px)] min-h-[620px] gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
            <main data-guide="keyword-map" className="relative min-h-0 bg-[var(--axis-surface-soft)]" onWheel={handleGraphWheel}>
              {graphMode === '3d' ? (
                <KeywordSphereGraph
                  nodes={visibleNodes}
                  edges={visibleEdges}
                  selectedId={selectedId}
                  zoom={scale}
                  themeRevision={themeRevision}
                  onSelectNode={selectGraphNode}
                />
              ) : (
                renderKeywordSvg()
              )}
              {hoveredId ? (
                <div className="pointer-events-none absolute left-5 top-5 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-xs text-[var(--axis-body)]">
                  {getNode(hoveredId).label}
                </div>
              ) : null}
              {keywordOverlayOpen ? (
                <div
                  className="absolute inset-0 z-20 bg-[rgba(250,248,244,0.72)] p-5 backdrop-blur-[2px] dark:bg-[rgba(24,25,31,0.72)]"
                  onClick={() => setKeywordOverlayOpen(false)}
                >
                  <section
                    className="mx-auto mt-8 max-w-[720px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-5 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.45)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="axis-kicker">Related card news</p>
                        <h2 className="mt-1 text-heading-4 font-display text-[var(--axis-ink)]">{selected.label}</h2>
                        <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">
                          {overlayCardsAll.length}건 중 {safeOverlayPage + 1}/{overlayPageCount}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {overlayCardsAll.length > overlayPageSize ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setOverlayPage((page) => page - 1)}
                              className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                            >
                              이전
                            </button>
                            <button
                              type="button"
                              onClick={() => setOverlayPage((page) => page + 1)}
                              className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                            >
                              다음
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setKeywordOverlayOpen(false)}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                    <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
                      {overlayCards.map((card) => (
                        <KeywordRelatedCardButton
                          key={card.id}
                          card={card}
                          onOpen={() => setKeywordDetailCardId(card.id)}
                        />
                      ))}
                    </div>
                    {overlayCardsAll.length === 0 ? (
                      <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                        연결된 카드뉴스가 없습니다.
                      </div>
                    ) : null}
                  </section>
                </div>
              ) : null}
            </main>

            <aside data-guide="keyword-detail" className={`min-h-0 overflow-y-auto border-t border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4 xl:border-l xl:border-t-0 ${detailOpen ? '' : 'xl:w-20'}`}>
              <button
                type="button"
                onClick={() => setDetailOpen((open) => !open)}
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--axis-accent-strong)]"
              >
                <Network size={16} />
                {detailOpen ? '상세 접기' : '상세 열기'}
              </button>
              {detailOpen ? (
                <div className="min-w-0 space-y-4">
                  <div className="min-w-0">
                    <p className="axis-kicker">Selected keyword</p>
                    <h2 className="mt-1 break-keep text-xl font-display font-semibold leading-tight text-ink">{selected.label}</h2>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <MiniStat label="전일 대비" value={`${selected.changeRate > 0 ? '+' : ''}${selected.changeRate}%`} />
                    <MiniStat label="분류" value={selected.category} />
                    <MiniStat label="출처" value={selected.sourceType} />
                  </div>
                  <div>
                    <p className="axis-kicker">Connected</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {graphEdges
                        .filter((edge) => edge.source === selected.id || edge.target === selected.id)
                        .map((edge) => {
                          const connectedId = edge.source === selected.id ? edge.target : edge.source;
                          return (
                            <ExecutiveBadge key={`${edge.source}-${edge.target}`} tone="accent">
                              {getNode(connectedId).label}
                            </ExecutiveBadge>
                          );
                        })}
                    </div>
                  </div>
                  <div className="h-[142px] min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
                        <CartesianGrid stroke="var(--axis-graph-edge)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--axis-muted)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--axis-muted)' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="agenticAi" name="언급량" stroke="var(--axis-graph-ax)" strokeWidth={2.2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </ExecutiveContainer>
      {graphFullscreenMode ? (
        <div className="fixed inset-0 z-50 bg-[var(--axis-canvas)]" onWheel={handleGraphWheel}>
          {graphFullscreenMode === '3d' ? (
            <KeywordSphereGraph
              nodes={visibleNodes}
              edges={visibleEdges}
              selectedId={selectedId}
              zoom={scale}
              themeRevision={themeRevision}
              fullscreen
              onSelectNode={selectGraphNode}
            />
          ) : (
            <div className="h-full w-full bg-[var(--axis-surface-soft)]">
              {renderKeywordSvg(true)}
            </div>
          )}
          <div className="absolute left-3 right-3 top-16 z-20 flex flex-wrap justify-end gap-2 sm:left-auto sm:right-5 sm:top-20 sm:max-w-[520px]">
            {(['전체', '기업', 'AX', '보안', '인프라', '수주'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-[var(--axis-radius-md)] border px-3 py-2 text-sm font-semibold shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] transition ${
                  category === item
                    ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
                    : 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="absolute left-3 right-3 top-3 z-20 grid grid-cols-[44px_64px_44px_minmax(92px,1fr)_112px] gap-2 sm:left-auto sm:right-5 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            <button
              type="button"
              aria-label="키워드 그래프 축소"
              onClick={() => setScale((current) => Math.max(0.75, Number((current - 0.1).toFixed(2))))}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-sm font-semibold text-[var(--axis-body)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)] sm:w-[68px] sm:px-3"
            >
              <Minus size={15} />
              <span className="hidden sm:inline">축소</span>
            </button>
            <span className="inline-flex h-10 min-w-0 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-sm font-semibold tabular-nums text-[var(--axis-body)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] sm:w-[70px]">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              aria-label="키워드 그래프 확대"
              onClick={() => setScale((current) => Math.min(1.45, Number((current + 0.1).toFixed(2))))}
              className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-sm font-semibold text-[var(--axis-body)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)] sm:w-[68px] sm:px-3"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">확대</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMode = graphFullscreenMode === '3d' ? '2d' : '3d';
                setGraphFullscreenMode(nextMode);
                setGraphMode(nextMode);
              }}
              className={`h-10 min-w-0 rounded-[var(--axis-radius-md)] border px-2 text-xs font-semibold shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] transition sm:w-[104px] sm:px-4 sm:text-sm ${
                graphFullscreenMode === '3d'
                  ? 'border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)] hover:border-[var(--axis-accent)]'
                  : 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
              }`}
            >
              {graphFullscreenMode === '3d' ? '키워드 보기' : '3D 보기'}
            </button>
            <button
              type="button"
              onClick={() => setGraphFullscreenMode(null)}
              className="h-10 min-w-0 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 text-xs font-semibold text-[var(--axis-ink)] shadow-[0_18px_48px_-34px_rgba(0,0,0,0.4)] hover:border-[var(--axis-accent)] sm:w-[126px] sm:px-4 sm:text-sm"
            >
              전체화면 닫기
            </button>
          </div>
          {keywordOverlayOpen ? (
            <>
              <button
                type="button"
                aria-label="관련 카드뉴스 팝업 닫기"
                onClick={() => setKeywordOverlayOpen(false)}
                className="absolute inset-0 z-[6] cursor-default"
              />
              <section
                className="absolute bottom-6 right-6 z-10 max-h-[min(520px,calc(100vh-120px))] w-[min(620px,calc(100vw-32px))] overflow-y-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)]/95 p-4 shadow-[0_28px_90px_-42px_rgba(0,0,0,0.56)] backdrop-blur"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="axis-kicker">Related card news</p>
                    <h2 className="mt-1 truncate text-xl font-display font-semibold text-[var(--axis-ink)]">{selected.label}</h2>
                    <p className="mt-1 text-xs font-semibold text-[var(--axis-muted)]">
                      {overlayCardsAll.length}건 중 {safeOverlayPage + 1}/{overlayPageCount}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {overlayCardsAll.length > overlayPageSize ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setOverlayPage((page) => page - 1)}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                        >
                          이전
                        </button>
                        <button
                          type="button"
                          onClick={() => setOverlayPage((page) => page + 1)}
                          className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                        >
                          다음
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setKeywordOverlayOpen(false)}
                      className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] px-3 py-2 text-sm font-semibold text-[var(--axis-body)] hover:border-[var(--axis-accent)]"
                    >
                      닫기
                    </button>
                  </div>
                </div>
                <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
                  {overlayCards.map((card) => (
                    <KeywordRelatedCardButton
                      key={card.id}
                      card={card}
                      onOpen={() => setKeywordDetailCardId(card.id)}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      ) : null}
      {keywordDetailCard ? (
        <FloatingCardNewsOverlay
          card={keywordDetailCard}
          cards={overlayCardsAll}
          bookmarked={bookmarkedIds.includes(keywordDetailCard.id)}
          slideIndex={keywordDetailSlideIndex}
          onSlideChange={setKeywordDetailSlideIndex}
          onBookmark={() => onToggleBookmark?.(keywordDetailCard.id)}
          onCardChange={(cardId) => {
            setKeywordDetailCardId(cardId);
            setKeywordDetailSlideIndex(0);
          }}
          onClose={() => {
            setKeywordDetailCardId(null);
            setKeywordDetailSlideIndex(0);
          }}
        />
      ) : null}
    </ExecutivePage>
  );
}
