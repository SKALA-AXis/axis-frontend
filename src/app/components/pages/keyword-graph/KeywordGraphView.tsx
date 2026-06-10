import { type WheelEvent as ReactWheelEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Maximize2, Minus, Plus } from 'lucide-react';
import * as THREE from 'three';
import { getCardLogoImageClass } from '../../../../features/card-news/cardLogoFallback';
import { normalizeCardNewsItem } from '../../../../features/card-news/api/cardNewsRepository';
import { useCardNews } from '../../../../features/card-news/hooks/useCardNews';
import { getDisplayDate, getPeerLabel } from '../../../../features/card-news/mappers/cardNewsExecutive';
import type { CardNewsItem } from '../../../../features/card-news/model/cardNews';
import { useDashboard } from '../../../../features/dashboard/hooks/useDashboard';
import { httpClient } from '../../../../shared/api/httpClient';
import { pickLatestTimestamp } from '../../../../shared/lib/viewFreshness';
import { graphCategoryColor, type KeywordEdge, type KeywordNode } from '../../../../shared/mocks/keywordGraph';
import { ExecutiveButton, ExecutiveContainer, ExecutivePage } from '../../executive/ExecutiveSystem';
import { FloatingCardNewsOverlay } from '../../shared/FloatingCardNewsOverlay';
import { Skeleton } from '../../ui/skeleton';
import { FilterChip } from '../shared/axis';

type NavigateHandler = (view: string) => void;

type KeywordGraphPayload = {
  selectedId?: string;
  nodes?: Array<Partial<KeywordNode>>;
  edges?: Array<Partial<KeywordEdge>>;
};

type KeywordGraphCardsPayload = {
  items?: Array<Partial<CardNewsItem>>;
  total?: number;
};

type KeywordGraphLoadStage = 'requesting' | 'normalizing' | 'rendering';

const graphCategories = ['AX', '보안', '인프라', '수주'] as const;
const allGraphCategories = ['기업', ...graphCategories] as const;
const emptySelectedNode: KeywordNode = {
  id: 'sk-axis',
  label: 'SK AX',
  x: 450,
  y: 280,
  size: 46,
  category: '기업',
  score: 0,
  changeRate: 0,
  sourceType: 'raw_articles',
};

function normalizeKeywordGraphNode(node: Partial<KeywordNode>, index: number): KeywordNode | null {
  if (!node.id || !node.label) return null;
  const category = allGraphCategories.includes(node.category as KeywordNode['category'])
    ? node.category as KeywordNode['category']
    : 'AX';
  return {
    id: node.id,
    label: node.label,
    x: typeof node.x === 'number' ? node.x : 450 + Math.cos(index) * 180,
    y: typeof node.y === 'number' ? node.y : 280 + Math.sin(index) * 180,
    size: typeof node.size === 'number' ? node.size : 18,
    category,
    score: typeof node.score === 'number' ? node.score : 0,
    changeRate: typeof node.changeRate === 'number' ? node.changeRate : 0,
    sourceType: node.sourceType ?? 'raw_articles',
  };
}

function normalizeKeywordGraphEdge(edge: Partial<KeywordEdge>): KeywordEdge | null {
  if (!edge.source || !edge.target) return null;
  return {
    source: edge.source,
    target: edge.target,
    weight: typeof edge.weight === 'number' ? edge.weight : 2,
    relationType: edge.relationType ?? '관련 기사',
  };
}

function KeywordRelatedCardButton({ card, onOpen }: { card: CardNewsItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full min-w-0 flex-col rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3 text-left transition hover:border-[var(--axis-accent)]"
    >
      <div className="relative mb-3 aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[var(--axis-radius-md)] bg-[#081324]">
        {card.coverImageUrl ? (
          <img
            src={card.coverImageUrl}
            alt={card.coverImageAlt}
            className={getCardLogoImageClass(card.coverImageUrl, 'related') ?? 'absolute inset-0 h-full w-full object-cover opacity-55'}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/78" />
        <span className="absolute bottom-2 left-2 max-w-[calc(100%_-_16px)] truncate text-xs font-semibold text-white">{getPeerLabel(card)}</span>
      </div>
      <p className="text-xs text-[var(--axis-muted)]">{getDisplayDate(card)}</p>
      <h3 className="mt-1 min-h-[3.75rem] line-clamp-3 text-sm font-semibold leading-5 text-[var(--axis-ink)]">{card.title}</h3>
    </button>
  );
}

function KeywordRelatedCardsLoading() {
  return (
    <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface-soft)] p-3">
          <Skeleton className="aspect-[4/3] w-full bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-3 h-3 w-20 bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-2 h-4 w-full bg-[var(--axis-surface-muted)]" />
          <Skeleton className="mt-2 h-4 w-4/5 bg-[var(--axis-surface-muted)]" />
        </div>
      ))}
    </div>
  );
}

function KeywordGraphLoading({
  stage,
  elapsedSeconds,
}: {
  stage: KeywordGraphLoadStage;
  elapsedSeconds: number;
}) {
  const stageIndex = stage === 'requesting' ? 0 : stage === 'normalizing' ? 1 : 2;
  const progress = Math.max(12, Math.min(92, 18 + elapsedSeconds * 9 + stageIndex * 12));

  return (
    <div className="flex h-full min-h-[420px] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[320px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-7 text-center shadow-[0_24px_70px_-42px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(220,90,36,0.22)] bg-[rgba(220,90,36,0.08)]">
          <div className="relative h-11 w-7 animate-[spin_1.8s_ease-in-out_infinite]">
            <div className="absolute inset-x-0 top-0 mx-auto h-5 w-6 rounded-b-full border-2 border-[var(--axis-accent)] border-t-0" />
            <div className="absolute inset-x-0 bottom-0 mx-auto h-5 w-6 rounded-t-full border-2 border-[var(--axis-accent)] border-b-0" />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--axis-accent)]" />
          </div>
        </div>

        <div className="mt-6 flex items-end justify-center gap-1">
          <span className="text-4xl font-semibold tabular-nums text-[var(--axis-ink)]">{Math.round(progress)}</span>
          <span className="mb-1 text-sm font-semibold text-[var(--axis-muted)]">%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--axis-surface-muted)]">
          <div
            className="h-full rounded-full bg-[var(--axis-accent)] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function normalizeGraphTerm(value: string) {
  return value.replace(/\s/g, '').toLowerCase();
}

const graphCompanySearchTerms: Record<string, string[]> = {
  'sk-axis': ['SK AX', 'SKAX', 'SK C&C', 'SK㈜ C&C', '에스케이씨앤씨', '에스케이에이엑스'],
  'samsung-sds': ['samsung_sds', '삼성 SDS', '삼성SDS', '삼성에스디에스'],
  'lg-cns': ['lg_cns', 'LG CNS', 'LGCNS', '엘지씨엔에스'],
  'hyundai-autoever': ['hyundai_autoever', '현대 오토에버', '현대오토에버'],
  'posco-dx': ['posco_dx', '포스코 DX', '포스코DX', '포스코디엑스', '포스코ICT'],
};

const graphCompanyPeerIdByNodeId: Record<string, string> = {
  'samsung-sds': 'samsung_sds',
  'lg-cns': 'lg_cns',
  'hyundai-autoever': 'hyundai_autoever',
  'posco-dx': 'posco_dx',
};

function cardSearchText(card: CardNewsItem) {
  return normalizeGraphTerm([
    card.peer_id,
    getPeerLabel(card),
    card.title,
    card.category,
    card.category_label,
    card.subtitle,
    card.sector,
    ...(card.keywords ?? []),
    ...(card.summary_lines ?? card.summary),
    ...(card.insights ?? []),
  ].filter(Boolean).join(' '));
}

function fallbackCompanyCards(
  companyNode: KeywordNode,
  cards: CardNewsItem[],
  nodes: KeywordNode[],
  edges: KeywordEdge[],
) {
  const connectedKeywordTerms = edges
    .filter((edge) => edge.source === companyNode.id || edge.target === companyNode.id)
    .map((edge) => nodes.find((node) => node.id === (edge.source === companyNode.id ? edge.target : edge.source))?.label)
    .filter((label): label is string => Boolean(label));
  const terms = [
    graphCompanyPeerIdByNodeId[companyNode.id],
    companyNode.label,
    ...(graphCompanySearchTerms[companyNode.id] ?? []),
    ...connectedKeywordTerms.slice(0, 6),
  ]
    .filter((term): term is string => Boolean(term))
    .map(normalizeGraphTerm);

  return cards.filter((card) => {
    const haystack = cardSearchText(card);
    return terms.some((term) => term.length > 0 && (haystack.includes(term) || term.includes(haystack)));
  });
}

function fallbackKeywordCards(keywordNode: KeywordNode, cards: CardNewsItem[]) {
  const keywordTerm = normalizeGraphTerm(keywordNode.label);
  if (!keywordTerm) return [];
  return cards.filter((card) => cardSearchText(card).includes(keywordTerm));
}

function fallbackNodeCards(
  node: KeywordNode,
  cards: CardNewsItem[],
  nodes: KeywordNode[],
  edges: KeywordEdge[],
) {
  return node.category === '기업'
    ? fallbackCompanyCards(node, cards, nodes, edges)
    : fallbackKeywordCards(node, cards);
}

async function fetchKeywordGraphCards(nodeId: string) {
  if (!httpClient) {
    throw new Error('API client is not configured.');
  }
  const payload = await httpClient.get<KeywordGraphCardsPayload>(`/api/keyword-graph/${encodeURIComponent(nodeId)}/cards?limit=30`);
  return (payload.items ?? []).map(normalizeCardNewsItem);
}

function resolveCssColor(value: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const variableMatch = value.match(/^var\((--[^)]+)\)$/);
  if (!variableMatch) return value;
  return getComputedStyle(document.documentElement).getPropertyValue(variableMatch[1]).trim() || fallback;
}

function getGraphNodeDisplayRadius(node: KeywordNode, active = false) {
  const base = node.category === '기업'
    ? node.size / 3.35
    : node.size >= 22
      ? node.size / 3.65
      : node.size / 4.05;
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

function graphEdgeMaterialStyle(active: boolean, isDarkMode: boolean) {
  if (active) {
    return {
      color: isDarkMode ? '#E2A079' : '#DC5A24',
      opacity: 1,
    };
  }

  return {
    color: isDarkMode ? '#FFF1D8' : '#393027',
    opacity: isDarkMode ? 0.52 : 0.68,
  };
}

function createGraphEdgeMesh(
  source: THREE.Vector3,
  target: THREE.Vector3,
  active: boolean,
  isDarkMode: boolean,
  fullscreen: boolean,
) {
  const direction = new THREE.Vector3().subVectors(target, source);
  const length = direction.length();
  if (length <= 0) return null;

  const edgeStyle = graphEdgeMaterialStyle(active, isDarkMode);
  const radius = active
    ? (fullscreen ? 1.1 : 0.78)
    : (fullscreen ? 0.78 : 0.56);
  const geometry = new THREE.CylinderGeometry(radius, radius, length, active ? 12 : 8);
  const material = new THREE.MeshBasicMaterial({
    color: edgeStyle.color,
    transparent: true,
    opacity: edgeStyle.opacity,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(source).add(target).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.renderOrder = active ? 2 : 1;
  return mesh;
}

function getSpherePosition(node: KeywordNode, radius: number, index = 0, totalNodes = 5) {
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
  const phi = Math.acos(1 - (2 * normalizedIndex) / (totalNodes + 2));
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
    nodes.forEach((node, index) => nodePositions.set(node.id, getSpherePosition(node, radius, index, nodes.length)));
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
      const mesh = createGraphEdgeMesh(source, target, active, isDarkMode, fullscreen);
      if (mesh) group.add(mesh);
    });

    const nodeMeshes: THREE.Mesh[] = [];
    const labelColor = isDarkMode ? '#FFF8EC' : resolveCssColor('var(--axis-ink)', '#1A1A1F');
    const labelStroke = isDarkMode ? 'rgba(4,5,8,0.96)' : 'rgba(255,255,255,0.98)';
    const createLabelSprite = (label: string, active: boolean, category: KeywordNode['category']) => {
      const labelCanvas = document.createElement('canvas');
      const context = labelCanvas.getContext('2d');
      const labelLines = splitGraphLabel(label);
      const fontSize = category === '기업' ? (active ? 35 : 30) : active ? 31 : 26;
      const lineHeight = fontSize * 1.08;
      const longestLine = labelLines.reduce((longest, line) => Math.max(longest, line.length), 0);
      const width = Math.max(150, longestLine * fontSize * 0.86 + 34);
      const height = Math.max(58, labelLines.length * lineHeight + 22);
      labelCanvas.width = width;
      labelCanvas.height = height;
      if (context) {
        context.font = `700 ${fontSize}px sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = labelColor;
        context.strokeStyle = labelStroke;
        context.lineWidth = isDarkMode ? 8 : 7;
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
      sprite.scale.set(width / (fullscreen ? 4.8 : 5.15), height / (fullscreen ? 4.8 : 5.15), 1);
      return sprite;
    };

    nodes.forEach((node) => {
      const position = nodePositions.get(node.id);
      if (!position) return;
      const active = node.id === selectedId;
      const color = resolveCssColor(graphCategoryColor[node.category], '#D48362');
      const visibleRadius = getGraphNodeDisplayRadius(node, active);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(Math.max(node.category === '기업' ? 10 : 6.5, visibleRadius), 28, 18),
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
        new THREE.SphereGeometry(Math.max(visibleRadius + 8, node.category === '기업' ? 22 : 15), 18, 12),
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
        {allGraphCategories.map((item) => (
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
  bookmarkedIds = [],
  onToggleBookmark,
  onUpdateTimeChange,
}: {
  onNavigate: NavigateHandler;
  bookmarkedIds?: string[];
  onToggleBookmark?: (cardId: string) => void;
  onUpdateTimeChange?: (updatedAt: string | null) => void;
}) {
  const { dashboard, isLoading: dashboardLoading } = useDashboard();
  const { cards, isLoading: cardsLoading } = useCardNews();
  const [graphPayload, setGraphPayload] = useState<KeywordGraphPayload | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphLoadStage, setGraphLoadStage] = useState<KeywordGraphLoadStage>('requesting');
  const [graphLoadingStartedAt, setGraphLoadingStartedAt] = useState(() => Date.now());
  const [graphLoadingElapsed, setGraphLoadingElapsed] = useState(0);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [keywordRelatedCards, setKeywordRelatedCards] = useState<CardNewsItem[]>([]);
  const [keywordCardsLoading, setKeywordCardsLoading] = useState(false);
  const [keywordCardsError, setKeywordCardsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('sk-axis');
  const [category, setCategory] = useState<KeywordNode['category'] | '전체'>('전체');
  const [scale, setScale] = useState(1);
  const [keywordOverlayOpen, setKeywordOverlayOpen] = useState(false);
  const [overlayPage, setOverlayPage] = useState(0);
  const [graphFullscreenOpen, setGraphFullscreenOpen] = useState(false);
  const [keywordDetailCardId, setKeywordDetailCardId] = useState<string | null>(null);
  const [keywordDetailSlideIndex, setKeywordDetailSlideIndex] = useState(0);
  const [themeRevision, setThemeRevision] = useState(0);
  const keywordCardsCacheRef = useRef(new Map<string, CardNewsItem[]>());
  const keywordCardsInFlightRef = useRef(new Map<string, Promise<CardNewsItem[]>>());

  const loadKeywordCardsForNode = useCallback(async (nodeId: string) => {
    const cachedCards = keywordCardsCacheRef.current.get(nodeId);
    if (cachedCards) return cachedCards;

    const inFlight = keywordCardsInFlightRef.current.get(nodeId);
    if (inFlight) return inFlight;

    const request = fetchKeywordGraphCards(nodeId)
      .then((apiCards) => {
        if (apiCards.length > 0) {
          keywordCardsCacheRef.current.set(nodeId, apiCards);
        }
        return apiCards;
      })
      .finally(() => {
        keywordCardsInFlightRef.current.delete(nodeId);
      });
    keywordCardsInFlightRef.current.set(nodeId, request);
    return request;
  }, []);

  const keywordNodes = useMemo(() => {
    const normalized = graphPayload?.nodes
      ?.map(normalizeKeywordGraphNode)
      .filter((node): node is KeywordNode => Boolean(node));
    return normalized ?? [];
  }, [graphPayload?.nodes]);
  const keywordEdges = useMemo(() => {
    const nodeIds = new Set(keywordNodes.map((node) => node.id));
    const normalized = graphPayload?.edges
      ?.map(normalizeKeywordGraphEdge)
      .filter((edge): edge is KeywordEdge => {
        if (!edge) return false;
        return nodeIds.has(edge.source) && nodeIds.has(edge.target);
      });
    return normalized ?? [];
  }, [graphPayload?.edges, keywordNodes]);
  const visibleNodes = useMemo(() => keywordNodes.filter((node) => (
    node.category === '기업' || category === '전체' || node.category === category
  )), [category, keywordNodes]);
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    return keywordEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
  }, [keywordEdges, visibleNodes]);
  const selected = keywordNodes.find((node) => node.id === selectedId) ?? keywordNodes[0] ?? emptySelectedNode;
  const overlayCardsAll = keywordRelatedCards;
  const overlayPageSize = 3;
  const overlayPageCount = Math.max(1, Math.ceil(overlayCardsAll.length / overlayPageSize));
  const safeOverlayPage = ((overlayPage % overlayPageCount) + overlayPageCount) % overlayPageCount;
  const overlayCards = overlayCardsAll.slice(safeOverlayPage * overlayPageSize, safeOverlayPage * overlayPageSize + overlayPageSize);
  const keywordDetailCard = keywordDetailCardId
    ? overlayCardsAll.find((card) => card.id === keywordDetailCardId) ?? cards.find((card) => card.id === keywordDetailCardId) ?? null
    : null;

  useEffect(() => {
    let cancelled = false;

    async function loadKeywordGraph() {
      if (!httpClient) {
        setGraphLoading(false);
        setGraphError('API client is not configured.');
        return;
      }
      try {
        setGraphLoadingStartedAt(Date.now());
        setGraphLoadingElapsed(0);
        setGraphLoading(true);
        setGraphLoadStage('requesting');
        setGraphError(null);
        const payload = await httpClient.get<KeywordGraphPayload>('/api/keyword-graph');
        if (cancelled) return;
        setGraphLoadStage('normalizing');
        setGraphPayload(payload);
        if (payload.selectedId) {
          setSelectedId(payload.selectedId);
        }
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            setGraphLoadStage('rendering');
            window.requestAnimationFrame(() => {
              if (!cancelled) {
                setGraphLoading(false);
              }
            });
          }
        });
      } catch (loadError) {
        if (!cancelled) {
          setGraphPayload(null);
          setGraphError(loadError instanceof Error ? loadError.message : '키워드 그래프 API를 불러오지 못했습니다.');
          setGraphLoading(false);
        }
      }
    }

    void loadKeywordGraph();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!graphLoading) return undefined;
    const intervalId = window.setInterval(() => {
      setGraphLoadingElapsed(Math.max(0, Math.floor((Date.now() - graphLoadingStartedAt) / 1000)));
    }, 500);
    return () => window.clearInterval(intervalId);
  }, [graphLoading, graphLoadingStartedAt]);

  useEffect(() => {
    if (keywordNodes.length === 0) return;
    if (!keywordNodes.some((node) => node.id === selectedId)) {
      setSelectedId(keywordNodes[0]?.id ?? 'sk-axis');
    }
  }, [keywordNodes, selectedId]);

  useEffect(() => {
    if (visibleNodes.length === 0) return;
    if (!visibleNodes.some((node) => node.id === selectedId)) {
      setSelectedId('sk-axis');
    }
  }, [selectedId, visibleNodes]);

  useEffect(() => {
    if (!httpClient || visibleNodes.length === 0) return undefined;
    let cancelled = false;

    async function prefetchKeywordCards() {
      const nodesToPrefetch = [
        ...visibleNodes.filter((node) => node.id === selectedId),
        ...visibleNodes.filter((node) => node.id !== selectedId),
      ];
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      const concurrency = 4;
      for (let index = 0; index < nodesToPrefetch.length; index += concurrency) {
        if (cancelled) return;
        const batch = nodesToPrefetch.slice(index, index + concurrency);
        await Promise.all(batch.map(async (node) => {
          if (cancelled || keywordCardsCacheRef.current.has(node.id)) return;
          try {
            await loadKeywordCardsForNode(node.id);
          } catch {
            // Click-time loading still handles the error state.
          }
        }));
        if (cancelled) return;
      }
    }

    void prefetchKeywordCards();
    return () => {
      cancelled = true;
    };
  }, [loadKeywordCardsForNode, selectedId, visibleNodes]);

  useEffect(() => {
    let cancelled = false;
    const selectedNode = keywordNodes.find((node) => node.id === selectedId);
    if (!selectedNode) {
      setKeywordRelatedCards([]);
      setKeywordCardsError(null);
      setKeywordCardsLoading(false);
      return undefined;
    }
    const cachedCards = keywordCardsCacheRef.current.get(selectedId);
    if (cachedCards) {
      setKeywordRelatedCards(cachedCards);
      setKeywordCardsError(null);
      setKeywordCardsLoading(false);
      return undefined;
    }
    setKeywordRelatedCards([]);

    async function loadKeywordCards() {
      if (!httpClient) return;
      try {
        setKeywordCardsLoading(true);
        setKeywordCardsError(null);
        const apiCards = await loadKeywordCardsForNode(selectedId);
        if (cancelled) return;
        setKeywordRelatedCards(apiCards);
      } catch (loadError) {
        if (!cancelled) {
          setKeywordRelatedCards([]);
          setKeywordCardsError(loadError instanceof Error ? loadError.message : '관련 카드뉴스를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setKeywordCardsLoading(false);
        }
      }
    }

    void loadKeywordCards();
    return () => {
      cancelled = true;
    };
  }, [keywordNodes, loadKeywordCardsForNode, selectedId]);

  useEffect(() => {
    setOverlayPage(0);
  }, [selectedId]);

  useEffect(() => {
    if (dashboardLoading || cardsLoading) return;
    onUpdateTimeChange?.(pickLatestTimestamp([
      ...cards.flatMap((card) => [card.created_at, card.published_date, card.date]),
      ...dashboard?.articles.map((article) => article.publishedAt) ?? [],
      dashboard?.dartSummary?.publishedAt ?? null,
    ]));
  }, [cards, cardsLoading, dashboard?.articles, dashboard?.dartSummary?.publishedAt, dashboardLoading, onUpdateTimeChange]);

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

  const selectGraphNode = (nodeId: string) => {
    setSelectedId(nodeId);
    setKeywordOverlayOpen(true);
  };
  const handleGraphWheel = (event: ReactWheelEvent<HTMLElement>) => {
    event.preventDefault();
    const nextDelta = event.deltaY > 0 ? -0.08 : 0.08;
    setScale((current) => Math.min(1.45, Math.max(0.75, Number((current + nextDelta).toFixed(2)))));
  };

  return (
    <ExecutivePage className="h-full overflow-hidden">
      <ExecutiveContainer className="flex h-full max-w-none flex-col overflow-hidden px-3 pb-3 pt-2 sm:px-4 lg:px-4">
        <section className="axis-panel-flat flex min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center lg:justify-end">
            <h1 className="sr-only">키워드 그래프</h1>
            <div data-guide="keyword-controls" className="flex flex-wrap gap-2">
              <div data-guide="keyword-filter" className="flex flex-wrap gap-2">
              <FilterChip active={category === '전체'} onClick={() => setCategory('전체')}>전체</FilterChip>
              {graphCategories.map((item) => (
                <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</FilterChip>
              ))}
              </div>
              <ExecutiveButton variant="secondary" icon={<Minus size={15} />} onClick={() => setScale((current) => Math.max(0.75, Number((current - 0.1).toFixed(2))))}>축소</ExecutiveButton>
              <span className="inline-flex min-h-10 items-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm font-semibold text-[var(--axis-body)]">
                {Math.round(scale * 100)}%
              </span>
              <ExecutiveButton variant="secondary" icon={<Plus size={15} />} onClick={() => setScale((current) => Math.min(1.45, Number((current + 0.1).toFixed(2))))}>확대</ExecutiveButton>
              <ExecutiveButton
                variant="secondary"
                icon={<Maximize2 size={15} />}
                onClick={() => setGraphFullscreenOpen(true)}
              >
                전체화면
              </ExecutiveButton>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-0">
            <main data-guide="keyword-map" className="relative min-h-0 overscroll-contain bg-[var(--axis-surface-soft)]" onWheel={handleGraphWheel}>
              {graphLoading ? (
                <KeywordGraphLoading stage={graphLoadStage} elapsedSeconds={graphLoadingElapsed} />
              ) : graphError ? (
                <div className="flex h-full min-h-[420px] items-center justify-center p-6">
                  <div className="max-w-[520px] rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-5 py-4 text-sm text-[var(--axis-body)]">
                    <p className="font-semibold text-[var(--axis-ink)]">키워드 그래프 API 연결 실패</p>
                    <p className="mt-2 text-[var(--axis-muted)]">{graphError}</p>
                  </div>
                </div>
              ) : keywordNodes.length === 0 ? (
                <div className="flex h-full min-h-[420px] items-center justify-center p-6">
                  <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-5 py-4 text-sm font-semibold text-[var(--axis-body)]">
                    raw_articles.matched_sector_details.keyword 데이터가 없습니다.
                  </div>
                </div>
              ) : (
                <KeywordSphereGraph
                  nodes={visibleNodes}
                  edges={visibleEdges}
                  selectedId={selectedId}
                  zoom={scale}
                  themeRevision={themeRevision}
                  onSelectNode={selectGraphNode}
                />
              )}
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
                    {keywordCardsLoading && overlayCardsAll.length === 0 ? (
                      <KeywordRelatedCardsLoading />
                    ) : keywordCardsError ? (
                      <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                        {keywordCardsError}
                      </div>
                    ) : (
                      <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
                        {overlayCards.map((card) => (
                          <KeywordRelatedCardButton
                            key={card.id}
                            card={card}
                            onOpen={() => setKeywordDetailCardId(card.id)}
                          />
                        ))}
                      </div>
                    )}
                    {!keywordCardsLoading && overlayCardsAll.length === 0 ? (
                      <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                        연결된 카드뉴스가 없습니다.
                      </div>
                    ) : null}
                  </section>
                </div>
              ) : null}
            </main>
          </div>
        </section>
      </ExecutiveContainer>
      {graphFullscreenOpen ? (
        <div className="fixed inset-0 z-50 bg-[var(--axis-canvas)]" onWheel={handleGraphWheel}>
          <KeywordSphereGraph
            nodes={visibleNodes}
            edges={visibleEdges}
            selectedId={selectedId}
            zoom={scale}
            themeRevision={themeRevision}
            fullscreen
            onSelectNode={selectGraphNode}
          />
          <div className="absolute left-3 right-3 top-16 z-20 flex flex-wrap justify-end gap-2 sm:left-auto sm:right-5 sm:top-20 sm:max-w-[520px]">
            {(['전체', ...graphCategories] as const).map((item) => (
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
          <div className="absolute left-3 right-3 top-3 z-20 grid grid-cols-[44px_64px_44px_112px] gap-2 sm:left-auto sm:right-5 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
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
              onClick={() => setGraphFullscreenOpen(false)}
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
                {keywordCardsLoading && overlayCardsAll.length === 0 ? (
                  <KeywordRelatedCardsLoading />
                ) : keywordCardsError ? (
                  <div className="rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                    {keywordCardsError}
                  </div>
                ) : (
                  <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
                    {overlayCards.map((card) => (
                      <KeywordRelatedCardButton
                        key={card.id}
                        card={card}
                        onOpen={() => setKeywordDetailCardId(card.id)}
                      />
                    ))}
                  </div>
                )}
                {!keywordCardsLoading && overlayCardsAll.length === 0 ? (
                  <div className="mt-3 rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-soft)] p-4 text-sm text-[var(--axis-muted)]">
                    연결된 카드뉴스가 없습니다.
                  </div>
                ) : null}
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
