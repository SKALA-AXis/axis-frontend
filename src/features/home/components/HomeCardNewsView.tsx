import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Bookmark, ChevronLeft, ChevronRight, Copy, ExternalLink, Mail, RotateCcw, Send, Share2 } from 'lucide-react';
import * as THREE from 'three';
import { useCardNews } from '../../card-news/hooks/useCardNews';
import type { CardNewsItem } from '../../card-news/model/cardNews';
import {
  getDisplayDate,
  getExecutiveRank,
  getExposureScore,
  getPeerLabel,
  getSectorLabel,
  getSuggestedActions,
  getSummaryLines,
  getSourceCount,
  getTrustScore,
} from '../../card-news/mappers/cardNewsExecutive';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../shared/ui/dialog';
import { Button } from '../../../shared/ui/button';
import { FloatingAiChat } from '../../../app/components/FloatingAiChat';
import { PlaceholderPattern } from '../../../app/components/PlaceholderPattern';
import { CardNewsDetailView } from '../../../app/components/CardNewsDetailView';
import { getCardImage, unsplashUrl } from '../../card-news/cardImages';

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

// Mistral 산-석양 팔레트 (Three.js 노드 색)
const keywordPalette = ['#DC5A24', '#E0822F', '#ECA341', '#F2C56B', '#A85F00', '#5A6B57', '#EA002C'];

/* Network Map 의 4 카테고리 키워드 사전 */
const keywordCategories: Record<string, { name_ko: string; keywords: string[] }> = {
  ax: {
    name_ko: 'AX',
    keywords: [
      'AX', 'AI Transformation', 'AI 전환', 'AI 혁신', '디지털 전환', 'DX',
      '제조AX', '제조 AX', '엔터프라이즈 AI', '에이전틱AI', '에이전틱 AI', 'agentic AI',
      'AI 에이전트', 'AI agent', '생성형 AI', 'generative AI', 'LLM', 'RAG',
      'AI 플랫폼', 'AI 팩토리', '스마트팩토리', 'smart factory',
      '디지털 트윈', 'digital twin', '업무 자동화', '프로세스 최적화', '운영 최적화',
    ],
  },
  security: {
    name_ko: '보안',
    keywords: [
      '보안', '사이버보안', '정보보안', '정보보호', '제로트러스트', 'ZTA',
      'EDR', 'XDR', 'SOC', '관제', '취약점', '랜섬웨어', '침해', '해킹',
      '데이터 유출', '개인정보', 'ISMS', 'ISMS-P',
      '클라우드 보안', 'AI 보안', 'AI security', 'secure AI', '프롬프트 인젝션',
    ],
  },
  infra: {
    name_ko: '인프라',
    keywords: [
      '인프라', 'IT 인프라', '클라우드', 'cloud', '클라우드 전환', '클라우드 관리',
      'MSP', 'managed service provider', '데이터센터', '데이터 센터', 'IDC',
      'GPU', 'GPU 클러스터', 'AI 인프라', '서버', '네트워크', '스토리지',
      '가상화', '쿠버네티스', 'Kubernetes', '컨테이너',
      '프라이빗 클라우드', '하이브리드 클라우드', '망분리',
    ],
  },
  deal: {
    name_ko: '수주',
    keywords: [
      '수주', '대형 수주', '메가딜', '단일 수주', '프로젝트 수주', '계약', '공급 계약',
      '사업자 선정', '우선협상대상자', 'MOU', '업무협약', '양해각서', '협약',
      '정부 협약', '정부', '공공', '공공 사업', '조달청', '디지털플랫폼정부',
      '인수', '합병', '인수합병', 'M&A', '지분 인수', '지분 투자', '투자 유치',
    ],
  },
};

/* legacy keywords 배열 — buildGraph 호환 위해 카테고리 키로 매핑 */
const keywords = Object.keys(keywordCategories);

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
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
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
      <div className="bg-canvas min-h-full flex items-center justify-center py-32">
        <div className="rounded-lg border border-hairline-soft bg-cream-soft px-5 py-4 text-body-sm text-steel">
          카드뉴스를 준비하는 중입니다.
        </div>
      </div>
    );
  }

  if (error || !selectedCard) {
    return (
      <div className="bg-canvas min-h-full flex items-center justify-center py-32">
        <div className="rounded-lg border-l-4 border-urgent bg-cream-soft px-5 py-4 text-body-sm text-charcoal">
          {error ?? '표시할 카드뉴스가 없습니다.'}
        </div>
      </div>
    );
  }

  // 핵심 카드 = 가장 중요한 1건 (already ranked)
  const heroCard = rankedCards[0];

  // Stats
  const totalCount = rankedCards.length;
  const urgentCount = rankedCards.filter((c) => c.exposure_band === 'high').length;
  const avgTrust = rankedCards.length
    ? Math.round(rankedCards.reduce((a, c) => a + getTrustScore(c), 0) / rankedCards.length)
    : 0;
  const peerSet = new Set(rankedCards.map((c) => c.peer_id ?? 'unknown'));

  // 오늘 날짜
  const todayDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  return (
    <div className="bg-canvas min-h-full">
      {/* ─── 1. NETWORK MAP — 큰 헤드만 + 그래프 안 메타 overlay ──── */}
      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-12 lg:py-12">
          {/* 헤드만 크게 */}
          <h2 className="font-display text-heading-1 text-ink mb-6" style={{ fontWeight: 800 }}>
            Network Map
          </h2>

          {/* 좌 (8 col) 그래프 + 우 (4 col) 갤러리 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 좌측: Three.js 그래프 + overlay 메타 */}
            <div className="relative lg:col-span-8">
              <div className="relative axis-graph-stage min-h-[420px]">
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

                {/* 좌상단 — Selected node */}
                <div className="pointer-events-none absolute left-6 top-6">
                  <p className="text-micro-eyebrow text-white/50">Selected</p>
                  <p className="mt-1.5 font-display text-heading-3 text-white" style={{ fontWeight: 700 }}>
                    {selectedNode?.label ?? '전체'}
                  </p>
                </div>

                {/* 우상단 — 메타 overlay (날짜/카테고리/Peer/카드) */}
                <div className="pointer-events-none absolute right-6 top-6 flex flex-col items-end gap-3">
                  <p className="text-fine-print text-white/50 tabular-nums">{todayDate}</p>
                  <div className="flex items-center gap-4 text-fine-print text-white/80 tabular-nums">
                    <span><span className="font-display-strong text-white">4</span> 카테고리</span>
                    <span className="text-white/30">·</span>
                    <span><span className="font-display-strong text-white">{peerSet.size}</span> Peer</span>
                    <span className="text-white/30">·</span>
                    <span><span className="font-display-strong text-white">{totalCount}</span> 카드</span>
                  </div>
                </div>

                {/* 우하단 — 초기화 button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNodeId('root');
                    setSelectedCardId(rankedCards[0]?.id ?? null);
                  }}
                  className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-fine-print text-white hover:bg-white/15 transition-colors"
                >
                  <RotateCcw size={12} />
                  초기화
                </button>
              </div>
            </div>

            {/* 우측: 갤러리 list (박스 폐기, 카드 큼) */}
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-6">
                {/* 헤더 — 박스 없이 단순 */}
                <div className="flex items-baseline justify-between mb-5 pb-3 border-b border-hairline-soft">
                  <h3 className="font-display text-heading-5 text-ink" style={{ fontWeight: 700 }}>
                    {selectedNode?.label ?? '전체'} 관련
                  </h3>
                  <span className="text-caption-bold text-stone tabular-nums">{galleryCards.length}건</span>
                </div>

                {galleryCards.length > 0 ? (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {galleryCards.slice(0, 5).map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setDetailCardId(card.id);
                        }}
                        className={`group block w-full text-left transition-colors ${
                          card.id === selectedCard.id ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        {/* 큰 thumbnail (16:9) */}
                        <div className="relative overflow-hidden rounded-md border border-hairline-soft mb-2.5">
                          <PlaceholderPattern peer={card.peer_id ?? 'default'} ratio="16/9" showLabel={false} />
                          {card.exposure_band === 'high' && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sk-mistral" />
                          )}
                          {card.id === selectedCard.id && (
                            <div className="absolute inset-0 ring-2 ring-action ring-inset rounded-md" />
                          )}
                        </div>
                        {/* meta + title */}
                        <p className="text-fine-print text-stone mb-1 tabular-nums">
                          {getPeerLabel(card)} · {getDisplayDate(card)}
                        </p>
                        <p className="text-body-md-strong text-ink line-clamp-2 leading-snug">
                          {card.title}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-steel py-12 text-center">
                    노드를 선택하면 관련 카드가 표시됩니다
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── 2. HERO CARD — 오늘의 핵심 동향 ──────────────────────── */}
      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-12 lg:py-24">
          <p className="text-micro-eyebrow text-action mb-6">오늘의 핵심 동향</p>
          <article className="group grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 cursor-pointer"
                   onClick={() => setDetailCardId(heroCard.id)}>
            <div className="relative overflow-hidden rounded-lg border border-hairline-soft lg:col-span-6">
              <PlaceholderPattern peer={heroCard.peer_id ?? 'default'} ratio="16/9" />
              {heroCard.exposure_band === 'high' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sk-mistral" />
              )}
            </div>
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-caption-bold text-stone mb-4">
                {getPeerLabel(heroCard)} · {heroCard.category_label || heroCard.category}
              </p>
              <h1 className="text-heading-1 font-display text-ink mb-4">{heroCard.title}</h1>
              {heroCard.subtitle && (
                <p className="text-subtitle text-charcoal mb-6">{heroCard.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-caption text-stone mb-8">
                <span>AXIS AI</span><span className="text-hairline-strong">·</span>
                <span>{getDisplayDate(heroCard)}</span><span className="text-hairline-strong">·</span>
                <span>출처 {getSourceCount(heroCard)}건</span><span className="text-hairline-strong">·</span>
                <span>신뢰도 {getTrustScore(heroCard)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setDetailCardId(heroCard.id)}>
                  전체 보기
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ─── 3. STATS STRIP (Hero 아래로 이동) ──────────────────── */}
      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            <Stat label="오늘 동향 카드" value={totalCount} unit="건" />
            <Stat label="우선 검토" value={urgentCount} unit="건" />
            <Stat label="평균 신뢰도" value={avgTrust} unit="%" />
            <Stat label="모니터링 Peer" value={peerSet.size} unit="사" />
          </div>
        </div>
      </section>

      {/* ─── 4. EDITORIAL CARDS (Bloomberg 톤 2-up grid) ───────── */}
      {rankedCards.length > 0 && (
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-12 lg:py-24">
            <div className="mb-12">
              <p className="text-micro-eyebrow text-action mb-3">전체 카드뉴스</p>
              <h2 className="font-display text-heading-2 text-ink" style={{ fontWeight: 700 }}>
                Insights <span className="tabular-nums text-stone">{rankedCards.length}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
              {rankedCards.map((card) => (
                <EditorialCard
                  key={card.id}
                  card={card}
                  onClick={() => setDetailCardId(card.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. CARD DETAIL — Stripe Press 톤 fullscreen overlay ── */}
      {detailCardId && (() => {
        const detailCard = rankedCards.find((c) => c.id === detailCardId);
        if (!detailCard) return null;
        const related = rankedCards
          .filter((c) =>
            c.id !== detailCard.id &&
            (c.peer_id === detailCard.peer_id || c.category === detailCard.category),
          )
          .slice(0, 3);
        return (
          <CardNewsDetailView
            card={detailCard}
            bookmarked={bookmarkedIds.includes(detailCard.id)}
            onBookmark={() => onToggleBookmark(detailCard.id)}
            onClose={() => setDetailCardId(null)}
            relatedCards={related}
            onSelectRelated={(id) => setDetailCardId(id)}
          />
        );
      })()}

      {/* ─── 7. SHARE DIALOG ────────────────────────────────────── */}
      <Dialog open={Boolean(shareCard)} onOpenChange={(open) => !open && setShareCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공유할 곳 선택</DialogTitle>
            <DialogDescription>{shareCard?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {shareTargets.map((target) => {
              const Icon = target.icon;
              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => void handleShare(target.id)}
                  className="flex w-full items-center gap-3 rounded-md border border-hairline-soft bg-canvas px-4 py-3 text-left transition-colors hover:border-action"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-action text-white">
                    <Icon size={18} />
                  </span>
                  <span className="text-body-md-strong text-ink">{target.label}</span>
                </button>
              );
            })}
          </div>
          {shareFeedback && <p className="mt-3 text-caption text-steel">{shareFeedback}</p>}
        </DialogContent>
      </Dialog>

      <FloatingAiChat />
    </div>
  );
}

/* ─── Stat cell ────────────────────────────────────────────── */
function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-micro-eyebrow text-stone mb-2">{label}</p>
      <p className="font-display text-stat-display text-ink tabular-nums">
        {value.toLocaleString('ko-KR')}
        {unit && <span className="ml-1 text-heading-4 text-steel">{unit}</span>}
      </p>
    </div>
  );
}

/* ─── Featured Card (Mistral store-utility-card 변형) ──────── */
function FeaturedCard({
  card,
  large = false,
  bookmarked,
  onClick,
  onBookmark,
  className = '',
}: {
  card: CardNewsItem;
  large?: boolean;
  bookmarked: boolean;
  onClick: () => void;
  onBookmark: () => void;
  className?: string;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-lg border border-hairline-soft bg-canvas cursor-pointer transition-colors hover:border-action ${className}`}
      onClick={onClick}
    >
      {/* image area */}
      <div className="relative">
        <PlaceholderPattern peer={card.peer_id ?? 'default'} ratio={large ? '16/9' : '4/3'} />
        {/* 좌측 4px indicator */}
        {card.exposure_band === 'high' && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-sk-mistral" />
        )}
        {/* bookmark */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onBookmark(); }}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md backdrop-blur-sm transition-colors ${
            bookmarked ? 'bg-action text-white' : 'bg-canvas/80 text-stone hover:text-ink'
          }`}
          aria-label={bookmarked ? '북마크 해제' : '북마크'}
        >
          <Bookmark className={bookmarked ? 'fill-current' : ''} size={15} />
        </button>
      </div>

      {/* content */}
      <div className="p-6">
        <p className="text-micro-eyebrow text-action mb-3">
          {getPeerLabel(card)}
          {card.category_label && <span className="text-stone"> · {card.category_label}</span>}
        </p>
        <h3 className={`font-display text-ink mb-3 line-clamp-2 ${large ? 'text-heading-3' : 'text-heading-4'}`}>
          {card.title}
        </h3>
        {large && card.subtitle && (
          <p className="text-body-md text-charcoal mb-4 line-clamp-2">{card.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-caption text-stone">
          <span>AXIS AI</span><span className="text-hairline-strong">·</span>
          <span>{getDisplayDate(card)}</span><span className="text-hairline-strong">·</span>
          <span>출처 {getSourceCount(card)}건</span>
        </div>
      </div>

      {/* click affordance — 우하단 chevron */}
      <ArrowUpRight className="absolute bottom-6 right-6 size-4 text-stone group-hover:text-action transition-colors" />
    </article>
  );
}

/* ─── Editorial Card (Bloomberg 톤) ─────────────────────────
 * 썸네일 + Peer eyebrow + 큰 제목 + 본문 + 섹터 underline.
 */
function EditorialCard({ card, onClick }: { card: CardNewsItem; onClick: () => void }) {
  const body = card.subtitle || card.summary?.[0] || getSummaryLines(card)[0] || '';
  const image = getCardImage(card);
  return (
    <article
      className="group cursor-pointer"
      onClick={onClick}
    >
      {/* 썸네일 — Unsplash 큐레이션 이미지 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-hairline-soft mb-7 bg-cream-soft">
        <img
          src={unsplashUrl(image.id, 800, 450)}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {card.exposure_band === 'high' && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-sk-mistral" />
        )}
      </div>

      {/* Peer eyebrow */}
      <p
        className="text-fine-print font-display-strong tracking-[0.12em] uppercase text-action mb-4"
      >
        {getPeerLabel(card)}
      </p>

      {/* Headline */}
      <h3
        className="font-display text-heading-3 text-ink leading-[1.2] mb-5 group-hover:text-action transition-colors"
        style={{ fontWeight: 700 }}
      >
        {card.title}
      </h3>

      {/* Body */}
      {body && (
        <p className="text-body-md leading-[1.7] text-charcoal mb-8 line-clamp-5">
          {body}
        </p>
      )}

      {/* Sector underline label */}
      <p className="inline-block text-body-sm-strong text-action border-b-2 border-action pb-1.5 group-hover:border-primary-deep group-hover:text-primary-deep transition-colors">
        {getSectorLabel(card)}
      </p>
    </article>
  );
}

/* ─── Compact Card (Network Map 갤러리 미리보기) ──────────── */
function CompactCard({
  card, active, bookmarked, onClick, onBookmark,
}: {
  card: CardNewsItem;
  active: boolean;
  bookmarked: boolean;
  onClick: () => void;
  onBookmark: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-canvas transition-colors ${
        active ? 'border-action' : 'border-hairline-soft hover:border-action'
      }`}
    >
      <div className="relative">
        <PlaceholderPattern peer={card.peer_id ?? 'default'} ratio="4/3" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onBookmark(); }}
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md ${
            bookmarked ? 'bg-action text-white' : 'bg-canvas/80 text-stone'
          }`}
        >
          <Bookmark className={bookmarked ? 'fill-current' : ''} size={12} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-fine-print text-stone mb-1 uppercase tracking-wider">
          {getDisplayDate(card)}
        </p>
        <p className="text-caption-bold text-ink line-clamp-2">{card.title}</p>
      </div>
    </article>
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

  // 4 카테고리 무조건 빈 키로 초기화 (카드가 0건이어도 노드는 표시)
  for (const key of keywords) {
    keywordMap.set(`keyword:${key}`, []);
  }

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

  // 카테고리 노드 — 모두 표시 (카드 0건이어도)
  Array.from(keywordMap.entries()).forEach(([id, keywordCards], index) => {
    const categoryKey = id.replace('keyword:', '');
    const category = keywordCategories[categoryKey];
    nodes.push({
      id,
      label: category?.name_ko ?? categoryKey,
      kind: 'keyword',
      color: keywordPalette[(index + 2) % keywordPalette.length],
      cards: keywordCards,
    });
    links.push({ source: 'root', target: id });

    // 카드가 있는 경우만 peer 와 연결
    if (keywordCards.length > 0) {
      const peers = new Set(keywordCards.map((card) => (card.peer_id ? `peer:${card.peer_id}` : `peer:${getPeerLabel(card)}`)));
      peers.forEach((peerId) => links.push({ source: peerId, target: id }));
    }
  });

  return { nodes, links };
}

function cardMatchesKeyword(card: CardNewsItem, categoryKey: string) {
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
    .join(' ')
    .toLowerCase();

  const category = keywordCategories[categoryKey];
  if (!category) return false;

  // 4개 카테고리 중 하나의 keyword가 포함되면 해당 분류로 본다.
  return category.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
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
  // 박스 폐기 — 텍스트만 (가독성은 검은 stroke + 흰 fill 으로)
  const dpr = 2;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const baseW = 512;
  const baseH = 128;
  canvas.width = baseW * dpr;
  canvas.height = baseH * dpr;

  if (context) {
    context.scale(dpr, dpr);
    context.clearRect(0, 0, baseW, baseH);
    context.font = '700 48px "Pretendard Variable", "Inter", system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    // outline (어두운 stroke 으로 다크 배경에서도 가독성 확보)
    context.lineWidth = 6;
    context.strokeStyle = 'rgba(15, 17, 23, 0.95)';
    context.lineJoin = 'round';
    context.miterLimit = 2;
    context.strokeText(text, baseW / 2, baseH / 2);
    // 흰 fill
    context.fillStyle = '#ffffff';
    context.fillText(text, baseW / 2, baseH / 2);
    // 미세 액센트 underline
    context.fillStyle = color;
    context.fillRect(baseW / 2 - 18, baseH / 2 + 32, 36, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, 0.6, 1);
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
