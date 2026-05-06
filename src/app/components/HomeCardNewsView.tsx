import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Copy, ExternalLink, Mail, RotateCcw, Send, Share2 } from 'lucide-react';
import * as THREE from 'three';
import { useCardNews } from '../../features/card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../features/card-news/model/cardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getExposureScore,
  getPeerLabel,
  getSuggestedActions,
  getSummaryLines,
} from '../../features/card-news/mappers/cardNewsExecutive';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { FloatingAiChat } from './FloatingAiChat';

interface HomeCardNewsViewProps {
  activeCardId?: string | null;
  bookmarkedIds: string[];
  onToggleBookmark: (cardId: string) => void;
}

type GraphNodeKind = 'root' | 'peer' | 'keyword';

type GraphNode = {
  id: string;
  label: string;
  kind: GraphNodeKind;
  color: string;
  cards: CardNewsItem[];
};

type GraphLink = {
  source: string;
  target: string;
};

const keywordPalette = ['#3cffd0', '#8b5cf6', '#38bdf8', '#f4d35e', '#ff5d73', '#9ef01a', '#ffffff'];
const keywords = ['AX', 'AI', '보안', '운영', '클라우드', '재무', '수주', '데이터', '제조', '레퍼런스'];

const shareTargets = [
  { id: 'copy', label: '링크 복사', icon: Copy },
  { id: 'mail', label: '이메일 공유', icon: Mail },
  { id: 'native', label: '기기 공유', icon: Send },
] as const;

export function HomeCardNewsView({ activeCardId, bookmarkedIds, onToggleBookmark }: HomeCardNewsViewProps) {
  const { cards, isLoading, error } = useCardNews();
  const rankedCards = useMemo(() => getExecutiveRank(cards), [cards]);
  const graph = useMemo(() => buildGraph(rankedCards), [rankedCards]);
  const [selectedNodeId, setSelectedNodeId] = useState('root');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [shareCard, setShareCard] = useState<CardNewsItem | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0];
  const galleryCards = selectedNode?.cards.length ? selectedNode.cards : rankedCards;
  const selectedCard =
    (selectedCardId ? rankedCards.find((card) => card.id === selectedCardId) : null) ??
    galleryCards[0] ??
    rankedCards[0] ??
    null;

  useEffect(() => {
    if (!activeCardId) {
      return;
    }

    const target = rankedCards.find((card) => card.id === activeCardId);
    if (target) {
      setSelectedCardId(target.id);
      setSelectedNodeId(target.peer_id ? `peer:${target.peer_id}` : 'root');
    }
  }, [activeCardId, rankedCards]);

  useEffect(() => {
    if (!selectedCardId && selectedCard) {
      setSelectedCardId(selectedCard.id);
    }
  }, [selectedCard, selectedCardId]);

  const handleShare = async (target: (typeof shareTargets)[number]['id']) => {
    if (!shareCard) {
      return;
    }

    const text = `${shareCard.title}\n${getSummaryLines(shareCard).join('\n')}\n${shareCard.sourceUrl}`;

    if (target === 'copy') {
      await navigator.clipboard.writeText(text);
      setShareFeedback('카드뉴스 링크를 복사했습니다.');
      return;
    }

    if (target === 'mail') {
      window.location.href = `mailto:?subject=${encodeURIComponent(shareCard.title)}&body=${encodeURIComponent(text)}`;
      setShareFeedback('이메일 앱으로 공유를 시도합니다.');
      return;
    }

    if (target === 'native' && navigator.share) {
      await navigator.share({ title: shareCard.title, text, url: shareCard.sourceUrl });
      setShareFeedback('공유를 완료했습니다.');
      return;
    }

    await navigator.clipboard.writeText(text);
    setShareFeedback('기기 공유를 지원하지 않아 링크를 복사했습니다.');
  };

  if (isLoading) {
    return (
      <div className="axis-dark-shell flex items-center justify-center">
        <div className="rounded-2xl border border-white/12 bg-white/8 px-5 py-4 text-sm text-white/64">카드뉴스 그래프를 준비하는 중입니다.</div>
      </div>
    );
  }

  if (error || !selectedCard) {
    return (
      <div className="axis-dark-shell flex items-center justify-center">
        <div className="rounded-2xl border border-white/12 bg-white/8 px-5 py-4 text-sm text-white/64">
          {error ?? '표시할 카드뉴스가 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="axis-dark-shell">
      <main className="mx-auto flex min-h-full w-full min-w-0 max-w-[1500px] flex-col gap-4 overflow-x-hidden px-4 py-4 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-5 md:pb-5 lg:px-6">
        <header className="flex min-w-0 flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#3cffd0]">AXIS signal graph</p>
            <h1 className="axis-card-display mt-2 break-words text-[2rem] font-black text-white sm:text-[3.6rem] lg:text-[4.4rem]">
              Card News Radar
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/58">
            Peer사와 키워드의 관계를 3D 그래프로 탐색하고, 선택된 신호와 연결된 카드뉴스를 오른쪽 갤러리에서 확인합니다.
          </p>
        </header>

        <section className="grid min-h-[calc(100dvh-180px)] min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_370px] xl:grid-rows-[minmax(340px,0.95fr)_minmax(430px,1.05fr)]">
          <section className="axis-graph-stage min-h-[330px] min-w-0 rounded-[28px] sm:min-h-[420px] xl:col-start-1 xl:row-start-1">
            <KeywordPeerGraph
              nodes={graph.nodes}
              links={graph.links}
              selectedNodeId={selectedNodeId}
              onSelect={(nodeId) => {
                setSelectedNodeId(nodeId);
                const nextNode = graph.nodes.find((node) => node.id === nodeId);
                setSelectedCardId(nextNode?.cards[0]?.id ?? rankedCards[0]?.id ?? null);
              }}
            />
            <div className="pointer-events-none absolute left-5 top-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">Selected signal</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">{selectedNode?.label ?? 'All'}</p>
            </div>
            <button
              type="button"
              aria-label="Reset"
              onClick={() => {
                setSelectedNodeId('root');
                setSelectedCardId(rankedCards[0]?.id ?? null);
              }}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/8 p-0 text-sm font-semibold text-white/72 transition hover:border-[#3cffd0]/50 hover:text-white sm:right-4 sm:top-4 sm:w-auto sm:px-4"
            >
              <RotateCcw size={15} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </section>

          <aside className="min-h-0 min-w-0 rounded-[28px] border border-white/12 bg-white/[0.06] p-3 xl:col-start-2 xl:row-span-2 xl:row-start-1">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3cffd0]">Gallery</p>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">{selectedNode?.label ?? '전체'} 카드뉴스</h2>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/58">{galleryCards.length}</span>
            </div>

            <div className="grid max-h-[min(420px,60dvh)] gap-3 overflow-y-auto pr-1 xl:max-h-[calc(100dvh-230px)]">
              {galleryCards.map((card) => (
                <GalleryCard
                  key={card.id}
                  card={card}
                  active={card.id === selectedCard.id}
                  bookmarked={bookmarkedIds.includes(card.id)}
                  onClick={() => setSelectedCardId(card.id)}
                  onBookmark={() => onToggleBookmark(card.id)}
                />
              ))}
            </div>
          </aside>

          <div className="min-h-0 min-w-0 xl:col-start-1 xl:row-start-2">
            <CardNewsReader
              card={selectedCard}
              isBookmarked={bookmarkedIds.includes(selectedCard.id)}
              onBookmark={() => onToggleBookmark(selectedCard.id)}
              onShare={() => {
                setShareCard(selectedCard);
                setShareFeedback('');
              }}
            />
          </div>
        </section>
      </main>

      <Dialog open={Boolean(shareCard)} onOpenChange={(open) => !open && setShareCard(null)}>
        <DialogContent className="max-w-md rounded-[24px] border-white/12 bg-[#151922] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">공유할 곳 선택</DialogTitle>
            <DialogDescription className="text-white/52">{shareCard?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {shareTargets.map((target) => {
              const Icon = target.icon;

              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => void handleShare(target.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/7 px-4 py-3 text-left transition hover:border-[#3cffd0]/50 hover:bg-white/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3cffd0] text-black">
                    <Icon size={18} />
                  </span>
                  <span className="font-medium text-white">{target.label}</span>
                </button>
              );
            })}
          </div>

          {shareFeedback ? <p className="text-sm text-white/58">{shareFeedback}</p> : null}
        </DialogContent>
      </Dialog>

      <FloatingAiChat />
    </div>
  );
}

function buildGraph(cards: CardNewsItem[]) {
  const nodes: GraphNode[] = [
    {
      id: 'root',
      label: 'AXIS',
      kind: 'root',
      color: '#ffffff',
      cards,
    },
  ];
  const links: GraphLink[] = [];

  const peerMap = new Map<string, CardNewsItem[]>();
  const keywordMap = new Map<string, CardNewsItem[]>();

  for (const card of cards) {
    const peerId = card.peer_id ? `peer:${card.peer_id}` : `peer:${getPeerLabel(card)}`;
    peerMap.set(peerId, [...(peerMap.get(peerId) ?? []), card]);

    for (const keyword of keywords) {
      if (cardMatchesKeyword(card, keyword)) {
        const keywordId = `keyword:${keyword}`;
        keywordMap.set(keywordId, [...(keywordMap.get(keywordId) ?? []), card]);
      }
    }
  }

  Array.from(peerMap.entries()).forEach(([id, peerCards], index) => {
    nodes.push({
      id,
      label: getPeerLabel(peerCards[0]),
      kind: 'peer',
      color: keywordPalette[index % keywordPalette.length],
      cards: peerCards,
    });
    links.push({ source: 'root', target: id });
  });

  Array.from(keywordMap.entries()).forEach(([id, keywordCards], index) => {
    nodes.push({
      id,
      label: id.replace('keyword:', ''),
      kind: 'keyword',
      color: keywordPalette[(index + 2) % keywordPalette.length],
      cards: keywordCards,
    });
    links.push({ source: 'root', target: id });

    const peers = new Set(keywordCards.map((card) => (card.peer_id ? `peer:${card.peer_id}` : `peer:${getPeerLabel(card)}`)));
    peers.forEach((peerId) => links.push({ source: peerId, target: id }));
  });

  return { nodes, links };
}

function cardMatchesKeyword(card: CardNewsItem, keyword: string) {
  const text = [
    card.title,
    card.subtitle,
    card.category,
    card.category_label,
    ...card.summary,
    ...(card.summary_lines ?? []),
    ...getSuggestedActions(card),
  ]
    .filter(Boolean)
    .join(' ');

  if (keyword === 'AI') {
    return /AI|에이전트|생성형/i.test(text);
  }

  return text.includes(keyword);
}

function KeywordPeerGraph({
  nodes,
  links,
  selectedNodeId,
  onSelect,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 15);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return mountFallbackGraph({ mount, nodes, links, selectedNodeId, onSelectRef });
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f1218, 1);
    renderer.domElement.setAttribute('data-testid', 'keyword-peer-graph-canvas');
    renderer.domElement.setAttribute('aria-label', '키워드와 Peer사 관계를 보여주는 3D 그래프');
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    const point = new THREE.PointLight(0x3cffd0, 1.4, 36);
    point.position.set(6, 6, 8);
    scene.add(ambient, point);

    const group = new THREE.Group();
    scene.add(group);

    const nodePositions = new Map<string, THREE.Vector3>();
    const nodeMeshes: THREE.Mesh[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: THREE.Object3D | null = null;
    let frameId = 0;
    let width = 1;
    let height = 1;

    const rootNode = nodes.find((node) => node.id === 'root') ?? nodes[0];
    nodePositions.set(rootNode.id, new THREE.Vector3(0, 0, 0));

    const outerNodes = nodes.filter((node) => node.id !== 'root');
    outerNodes.forEach((node, index) => {
      const ring = node.kind === 'peer' ? 4.2 : 6.1;
      const zLift = node.kind === 'peer' ? 0.8 : -0.5;
      const angle = (index / outerNodes.length) * Math.PI * 2;
      nodePositions.set(node.id, new THREE.Vector3(Math.cos(angle) * ring, Math.sin(angle) * ring * 0.62, Math.sin(angle * 1.7) * 1.2 + zLift));
    });

    for (const link of links) {
      const source = nodePositions.get(link.source);
      const target = nodePositions.get(link.target);
      if (!source || !target) continue;

      const geometry = new THREE.BufferGeometry().setFromPoints([source, target]);
      const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });
      group.add(new THREE.Line(geometry, material));
    }

    for (const node of nodes) {
      const position = nodePositions.get(node.id) ?? new THREE.Vector3();
      const isSelected = node.id === selectedNodeId;
      const radius = node.kind === 'root' ? 0.55 : node.kind === 'peer' ? 0.34 : 0.25;
      const geometry = new THREE.SphereGeometry(isSelected ? radius * 1.35 : radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        emissive: new THREE.Color(node.color),
        emissiveIntensity: isSelected ? 0.65 : 0.22,
        metalness: 0.22,
        roughness: 0.34,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.userData.nodeId = node.id;
      mesh.userData.baseScale = isSelected ? 1.2 : 1;
      group.add(mesh);
      nodeMeshes.push(mesh);

      const sprite = createLabelSprite(node.label, node.kind === 'root' ? '#ffffff' : node.color);
      sprite.position.copy(position.clone().add(new THREE.Vector3(0, node.kind === 'root' ? -0.95 : -0.58, 0)));
      group.add(sprite);
    }

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(nodeMeshes)[0]?.object ?? null;
      hovered = hit;
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
    };

    const handleClick = () => {
      if (hovered?.userData.nodeId) {
        onSelectRef.current(hovered.userData.nodeId as string);
      }
    };

    renderer.domElement.addEventListener('pointermove', updatePointer);
    renderer.domElement.addEventListener('click', handleClick);
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;
      group.rotation.y = t * 0.18;
      group.rotation.x = Math.sin(t * 0.35) * 0.09;

      for (const mesh of nodeMeshes) {
        const selected = mesh.userData.nodeId === selectedNodeId;
        const hover = mesh === hovered;
        const pulse = 1 + Math.sin(t * 2.8 + mesh.position.x) * 0.035;
        const targetScale = (selected ? 1.28 : hover ? 1.18 : 1) * pulse;
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointermove', updatePointer);
      renderer.domElement.removeEventListener('click', handleClick);
      mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material?.dispose?.();
        }
      });
      renderer.dispose();
    };
  }, [links, nodes, selectedNodeId]);

  return <div ref={mountRef} className="h-full min-h-[330px] w-full sm:min-h-[420px]" data-testid="keyword-peer-graph" />;
}

function mountFallbackGraph({
  mount,
  nodes,
  links,
  selectedNodeId,
  onSelectRef,
}: {
  mount: HTMLDivElement;
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNodeId: string;
  onSelectRef: { current: (nodeId: string) => void };
}) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return () => {};
  }

  canvas.setAttribute('data-testid', 'keyword-peer-graph-canvas');
  canvas.setAttribute('aria-label', '키워드와 Peer사 관계를 보여주는 3D 그래프');
  canvas.style.display = 'block';
  canvas.style.height = '100%';
  canvas.style.width = '100%';
  mount.appendChild(canvas);

  let width = 1;
  let height = 1;
  let frameId = 0;
  let hoveredId = '';
  let positions = new Map<string, { x: number; y: number; radius: number; node: GraphNode }>();

  const resize = () => {
    const bounds = mount.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const computePositions = (time: number) => {
    const next = new Map<string, { x: number; y: number; radius: number; node: GraphNode }>();
    const centerX = width / 2;
    const centerY = height / 2 + 8;
    const rootNode = nodes.find((node) => node.id === 'root') ?? nodes[0];
    next.set(rootNode.id, { x: centerX, y: centerY, radius: selectedNodeId === rootNode.id ? 36 : 30, node: rootNode });

    const outerNodes = nodes.filter((node) => node.id !== rootNode.id);
    const radiusX = Math.max(120, width * 0.34);
    const radiusY = Math.max(86, height * 0.32);
    outerNodes.forEach((node, index) => {
      const baseAngle = (index / Math.max(1, outerNodes.length)) * Math.PI * 2;
      const angle = baseAngle + time * 0.16;
      const layer = node.kind === 'peer' ? 0.76 : 1;
      const x = centerX + Math.cos(angle) * radiusX * layer;
      const y = centerY + Math.sin(angle) * radiusY * layer;
      const radius = node.kind === 'peer' ? 16 : 12;
      next.set(node.id, { x, y, radius: selectedNodeId === node.id ? radius * 1.36 : radius, node });
    });

    positions = next;
  };

  const drawLabel = (label: string, x: number, y: number, color: string) => {
    context.save();
    context.font = '700 11px Arial, sans-serif';
    const textWidth = Math.min(140, Math.max(54, context.measureText(label).width + 28));
    const labelX = x - textWidth / 2;
    const labelY = y + 22;
    context.fillStyle = 'rgba(0, 0, 0, 0.62)';
    roundRect(context, labelX, labelY, textWidth, 20, 10);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 1.4;
    context.stroke();
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, x, labelY + 10, textWidth - 14);
    context.restore();
  };

  const draw = () => {
    const time = performance.now() * 0.001;
    computePositions(time);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#0f1218';
    context.fillRect(0, 0, width, height);

    for (const link of links) {
      const source = positions.get(link.source);
      const target = positions.get(link.target);
      if (!source || !target) continue;

      context.beginPath();
      context.moveTo(source.x, source.y);
      context.lineTo(target.x, target.y);
      context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      context.lineWidth = 1;
      context.stroke();
    }

    for (const { x, y, radius, node } of positions.values()) {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredId === node.id;
      const pulse = 1 + Math.sin(time * 3 + x * 0.01) * 0.04;
      const drawRadius = radius * (isHovered ? 1.12 : 1) * pulse;
      const gradient = context.createRadialGradient(x - drawRadius * 0.35, y - drawRadius * 0.35, 0, x, y, drawRadius * 1.25);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.24, node.color);
      gradient.addColorStop(1, isSelected ? node.color : 'rgba(255,255,255,0.20)');

      context.beginPath();
      context.arc(x, y, drawRadius, 0, Math.PI * 2);
      context.fillStyle = gradient;
      context.fill();

      if (isSelected || isHovered) {
        context.beginPath();
        context.arc(x, y, drawRadius + 8, 0, Math.PI * 2);
        context.strokeStyle = isSelected ? 'rgba(60, 255, 208, 0.72)' : 'rgba(255, 255, 255, 0.34)';
        context.lineWidth = 1.5;
        context.stroke();
      }

      drawLabel(node.label, x, y, node.kind === 'root' ? '#ffffff' : node.color);
    }
  };

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    draw();
  };

  const updatePointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nextHovered = '';

    for (const { x: nodeX, y: nodeY, radius, node } of positions.values()) {
      const distance = Math.hypot(x - nodeX, y - nodeY);
      if (distance <= radius + 14) {
        nextHovered = node.id;
        break;
      }
    }

    hoveredId = nextHovered;
    canvas.style.cursor = hoveredId ? 'pointer' : 'grab';
  };

  const handleClick = () => {
    if (hoveredId) {
      onSelectRef.current(hoveredId);
    }
  };

  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('click', handleClick);
  resize();
  animate();

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointermove', updatePointer);
    canvas.removeEventListener('click', handleClick);
    mount.removeChild(canvas);
  };
}

function createLabelSprite(text: string, color: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 128;

  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '700 34px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(0, 0, 0, 0.58)';
    roundRect(context, 52, 28, 408, 70, 34);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = '#ffffff';
    context.fillText(text, 256, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.5, 0.62, 1);
  return sprite;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function GalleryCard({
  card,
  active,
  bookmarked,
  onClick,
  onBookmark,
}: {
  card: CardNewsItem;
  active: boolean;
  bookmarked: boolean;
  onClick: () => void;
  onBookmark: () => void;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[22px] border text-left transition ${
        active ? 'border-[#3cffd0] bg-white text-black' : 'border-white/12 bg-white/[0.07] text-white hover:border-white/30'
      }`}
    >
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className={`relative aspect-[1.55] ${active ? 'bg-[#fbfbfb]' : 'bg-[#151922]'}`}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(60,255,208,0.18),rgba(139,92,246,0.14),transparent)]" />
          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            {getPeerLabel(card)}
          </div>
        </div>
        <div className="p-3">
          <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${active ? 'text-black/46' : 'text-white/40'}`}>
            {getDisplayDate(card)} · Exposure {getExposureScore(card)}
          </p>
          <h3 className={`mt-2 line-clamp-3 text-sm font-semibold leading-5 ${active ? 'text-black' : 'text-white/90'}`}>
            {card.title}
          </h3>
        </div>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onBookmark();
        }}
        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full ${
          bookmarked ? 'bg-[#3cffd0] text-black' : 'bg-black/60 text-white'
        }`}
        aria-label={bookmarked ? '북마크 해제' : '북마크'}
      >
        <Bookmark className={bookmarked ? 'fill-current' : ''} size={15} />
      </button>
    </article>
  );
}

function CardNewsReader({
  card,
  isBookmarked,
  onBookmark,
  onShare,
}: {
  card: CardNewsItem;
  isBookmarked: boolean;
  onBookmark: () => void;
  onShare: () => void;
}) {
  const pages = buildCardPages(card);
  const [pageIndex, setPageIndex] = useState(0);
  const page = pages[pageIndex] ?? pages[0];

  useEffect(() => {
    setPageIndex(0);
  }, [card.id]);

  const move = (direction: 'previous' | 'next') => {
    setPageIndex((current) => {
      if (direction === 'previous') {
        return Math.max(0, current - 1);
      }

      return Math.min(pages.length - 1, current + 1);
    });
  };

  return (
    <section className="grid min-h-[430px] gap-4 lg:grid-cols-[minmax(300px,430px)_minmax(0,1fr)]">
      <div className="flex items-center justify-center">
        <article className="axis-editorial-card relative aspect-[4/5] h-[min(64vh,620px)] min-h-[390px] w-auto overflow-hidden rounded-[30px] shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
          <div className="absolute inset-x-0 top-0 h-2 bg-[#3cffd0]" />
          <div className="flex h-full flex-col p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-black px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {page.type}
              </span>
              <span className="font-mono text-[11px] font-semibold text-black/42">
                {pageIndex + 1}/{pages.length}
              </span>
            </div>
            <div className="mt-auto">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">{getPeerLabel(card)}</p>
              <h2 className="axis-card-display mt-3 text-[2.4rem] font-black text-black sm:text-[3.1rem]">{page.title}</h2>
              <div className="mt-5 space-y-3">
                {page.lines.map((line) => (
                  <p key={line} className="text-base font-medium leading-7 text-black/76">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="flex min-w-0 flex-col justify-center rounded-[28px] border border-white/12 bg-white/[0.06] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#3cffd0] px-3 py-1.5 text-xs font-bold text-black">CARD NEWS</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/62">{getDisplayDate(card)}</span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold leading-8 tracking-[-0.04em] text-white">{card.title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">{getSuggestedActions(card)[0] ?? card.detailDescription}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => move('previous')}
            disabled={pageIndex === 0}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white transition disabled:opacity-30"
            aria-label="이전 카드뉴스 페이지"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={() => move('next')}
            disabled={pageIndex === pages.length - 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white transition disabled:opacity-30"
            aria-label="다음 카드뉴스 페이지"
          >
            <ChevronRight size={19} />
          </button>
          <button
            type="button"
            onClick={onBookmark}
            className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              isBookmarked ? 'bg-[#3cffd0] text-black' : 'border border-white/12 bg-white/8 text-white'
            }`}
          >
            <Bookmark className={isBookmarked ? 'fill-current' : ''} size={16} />
            {isBookmarked ? '저장됨' : '북마크'}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 text-sm font-semibold text-white"
          >
            <Share2 size={16} />
            공유
          </button>
          <a
            href={card.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 text-sm font-semibold text-white"
          >
            <ExternalLink size={16} />
            원문
          </a>
        </div>
      </div>
    </section>
  );
}

function buildCardPages(card: CardNewsItem) {
  const summary = getSummaryLines(card);
  const pages = [
    {
      type: card.category_label ?? card.category,
      title: card.title,
      lines: summary.slice(0, 3),
    },
  ];

  card.articlePages.forEach((page) => {
    pages.push({
      type: 'Brief',
      title: page.title,
      lines: page.paragraphs.slice(0, 2),
    });
  });

  pages.push({
    type: 'Action',
    title: 'SK AX Next Move',
    lines: getSuggestedActions(card).slice(0, 3),
  });

  return pages;
}
