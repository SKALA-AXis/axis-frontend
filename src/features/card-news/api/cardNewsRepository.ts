import { httpClient } from '../../../shared/api/httpClient';
import { getFallbackCardLogo } from '../cardLogoFallback';
import type { CardNewsItem } from '../model/cardNews';

export interface CardNewsRepository {
  list(): Promise<CardNewsItem[]>;
  today(): Promise<CardNewsItem[]>;
}

class HttpCardNewsRepository implements CardNewsRepository {
  async list(): Promise<CardNewsItem[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const response = await httpClient.get<{ items: Partial<CardNewsItem>[] }>('/api/cards');
    return response.items.map(normalizeCardNewsItem);
  }

  async today(): Promise<CardNewsItem[]> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    const response = await httpClient.get<{ items: Partial<CardNewsItem>[] }>('/api/cards/today?limit=10');
    return response.items.map(normalizeCardNewsItem);
  }
}

const sourceNameByHost: Record<string, string> = {
  'www.mk.co.kr': '매일경제',
  'm.mk.co.kr': '매일경제',
  'www.klnews.co.kr': '물류신문',
  'news.einfomax.co.kr': '연합인포맥스',
  'www.mediapen.com': '미디어펜',
  'www.paxetv.com': '팍스경제TV',
  'www.srtimes.kr': 'SR타임스',
  'www.pointdaily.co.kr': '포인트데일리',
  'www.nspna.com': 'NSP통신',
  'www.news1.kr': '뉴스1',
  'news1.kr': '뉴스1',
  'www.asiatoday.co.kr': '아시아투데이',
  'asiatoday.co.kr': '아시아투데이',
  'www.aitimes.com': 'AI타임스',
  'aitimes.com': 'AI타임스',
  'science.ytn.co.kr': 'YTN 사이언스',
  'www.shinailbo.co.kr': '신아일보',
  'shinailbo.co.kr': '신아일보',
  'www.datanet.co.kr': '데이터넷',
  'datanet.co.kr': '데이터넷',
  'www.ddaily.co.kr': '디지털데일리',
  'ddaily.co.kr': '디지털데일리',
  'www.newstomato.com': '뉴스토마토',
  'newstomato.com': '뉴스토마토',
};

function firstNonEmptyString(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0);
}

function isSafeCoverImageUrl(value: string | null | undefined) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.startsWith('/') || trimmed.startsWith('https://');
}

function resolveSourceName(sourceName?: string, url?: string) {
  if (sourceName && sourceName !== 'naver_news') {
    return sourceName;
  }

  if (!url) {
    return sourceName ?? '출처 미상';
  }

  try {
    const host = new URL(url).hostname.toLowerCase();
    if (sourceNameByHost[host]) {
      return sourceNameByHost[host];
    }
    return host.replace(/^www\./, '');
  } catch {
    return sourceName ?? '출처 미상';
  }
}

export function normalizeCardNewsItem(card: Partial<CardNewsItem>): CardNewsItem {
  const primarySlide = card.slides?.find((slide) => slide.order === 1) ?? card.slides?.[0];
  const derivedSummary = card.summary_lines?.length
    ? card.summary_lines
    : card.summary?.length
      ? card.summary
      : primarySlide?.body
        ? primarySlide.body.split('\n').filter(Boolean)
        : ['요약 정보가 아직 정리되지 않았습니다.'];
  const derivedArticlePages = card.articlePages?.length
    ? card.articlePages
    : card.slides?.length
      ? card.slides.map((slide) => ({
          title: slide.title,
          paragraphs: slide.body ? slide.body.split('\n').filter(Boolean) : [],
        }))
        : [
          {
            title: card.detailTitle ?? card.title ?? '카드뉴스 상세',
            paragraphs: [card.detailDescription ?? derivedSummary[0] ?? '상세 설명이 없습니다.'],
          },
        ];
  const fallbackLogo = getFallbackCardLogo(card);
  const safeCoverImageUrl = isSafeCoverImageUrl(card.coverImageUrl) ? card.coverImageUrl : null;
  const safeDisplayImageUrl = isSafeCoverImageUrl(card.display?.background_asset_url) ? card.display?.background_asset_url : null;
  const safeSlideImageUrl = isSafeCoverImageUrl(primarySlide?.image_url) ? primarySlide?.image_url : null;
  const coverImageUrl = firstNonEmptyString(
    safeCoverImageUrl,
    safeDisplayImageUrl,
    safeSlideImageUrl,
    fallbackLogo?.url,
  ) ?? '/png.png';
  const normalizedSources = card.sources?.map((source) => ({
    ...source,
    source_name: resolveSourceName(source.source_name, source.url),
  }));
  const normalizedEvidenceChain = card.evidence_chain
    ? {
        ...card.evidence_chain,
        source_links: card.evidence_chain.source_links?.map((source) => ({
          ...source,
          source_name: resolveSourceName(source.source_name, source.url),
        })),
      }
    : card.evidence_chain;
  const primarySourceName = resolveSourceName(card.source, card.sourceUrl ?? normalizedSources?.[0]?.url);
  const sourceRawArticleIds = card.source_raw_article_ids ?? card.sourceRawArticleIds ?? [];
  const provenanceRawArticleIds = normalizedEvidenceChain?.provenance?.raw_article_ids ?? [];
  const sourceCountCandidates = [
    card.source_count,
    sourceRawArticleIds.length > 0 ? new Set(sourceRawArticleIds).size : null,
    provenanceRawArticleIds.length > 0 ? new Set(provenanceRawArticleIds).size : null,
    normalizedSources?.length,
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  const sourceCount = sourceCountCandidates.length > 0 ? Math.max(...sourceCountCandidates) : null;

  return {
    id: card.id ?? `card-${Math.random().toString(36).slice(2, 10)}`,
    category: card.category ?? card.category_label ?? 'AX',
    date: card.date ?? card.published_date ?? '',
    title: card.title ?? '제목 없음',
    coverImageUrl,
    coverImageAlt:
      firstNonEmptyString(
        card.coverImageAlt,
        primarySlide?.image_alt,
        coverImageUrl === fallbackLogo?.url ? fallbackLogo?.alt : undefined,
      ) ??
      `${card.title ?? '카드뉴스'} 대표 이미지`,
    summary: card.summary?.length ? card.summary : derivedSummary,
    articlePages: derivedArticlePages,
    insights: card.insights?.length ? card.insights : card.implication?.potential_impact ? [card.implication.potential_impact] : [],
    source: primarySourceName,
    sourceUrl: card.sourceUrl ?? normalizedSources?.[0]?.url ?? '#',
    detailTitle: card.detailTitle ?? card.title ?? '카드뉴스 상세',
    detailDescription: card.detailDescription ?? card.implication?.why_important ?? '',
    detailPoints: card.detailPoints?.length ? card.detailPoints : [],
    actionItems: card.actionItems?.length ? card.actionItems : card.implication?.suggested_actions ?? [],
    mediaAssets: card.mediaAssets,
    textFields: card.textFields,
    valueFields: card.valueFields,
    displayEntries: card.displayEntries,
    peer_id: card.peer_id,
    cluster_id: card.cluster_id,
    subtitle: card.subtitle ?? null,
    category_label: card.category_label ?? null,
    published_date: card.published_date ?? null,
    summary_lines: card.summary_lines ?? derivedSummary,
    event_type: card.event_type,
    sector: card.sector,
    keywords: card.keywords?.filter((keyword): keyword is string => typeof keyword === 'string' && keyword.trim().length > 0) ?? [],
    exposure_band: card.exposure_band,
    exposure_score: card.exposure_score,
    trust_score: card.trust_score,
    implication: card.implication,
    sources: normalizedSources,
    source_count: sourceCount,
    source_raw_article_ids: sourceRawArticleIds,
    evidence_chain: normalizedEvidenceChain,
    financial_context: card.financial_context ?? null,
    slides: card.slides,
    display: card.display,
    validation_pass: card.validation_pass ?? null,
    is_human_reviewed: card.is_human_reviewed ?? false,
    is_bookmarked: card.is_bookmarked ?? false,
    bookmark_count: card.bookmark_count ?? 0,
    share_count: card.share_count ?? 0,
    created_at: card.created_at ?? new Date().toISOString(),
  };
}

export const cardNewsRepository: CardNewsRepository = new HttpCardNewsRepository();
