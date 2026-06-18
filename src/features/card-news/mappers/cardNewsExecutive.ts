/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 및 카드뉴스 데이터 연동
 *   2026-05-18 최종민 — 프론트 전면 개편·peer 로고 fallback, Today Insight 듀얼레인 비교 컨텍스트 추가
 *   2026-05-18 박지원 — 신뢰도 점수 UI 제거, 소스 카운트 배지 fallback·소스 발행 시각 정렬 보정
 */
import type { CardNewsEvidenceChain, CardNewsItem } from '../model/cardNews';
import {
  cardNewsExecutiveDefaults,
  cardNewsExposureLabels,
  cardNewsPeerLabels,
  cardNewsPeerTitleAliases,
  cardNewsSectorLabels,
} from '../../../shared/content/cardNewsLabels';

export function getPeerLabel(card: CardNewsItem) {
  if (card.peer_id) {
    return cardNewsPeerLabels[card.peer_id];
  }

  return card.displayEntries?.[0]?.peerCompany ?? derivePeerFromTitle(card.title) ?? cardNewsExecutiveDefaults.peerLabel;
}

export function getSectorLabel(card: CardNewsItem) {
  if (card.sector) {
    return cardNewsSectorLabels[card.sector];
  }

  return card.category_label ?? card.category;
}

export function getDisplayDate(card: CardNewsItem) {
  return card.published_date ?? card.date;
}

export function getExposureLabel(card: CardNewsItem) {
  return card.exposure_band ? cardNewsExposureLabels[card.exposure_band] : cardNewsExecutiveDefaults.exposureLabel;
}

export function getExposureScore(card: CardNewsItem) {
  if (typeof card.exposure_score === 'number') {
    return Math.round(card.exposure_score * 100);
  }

  const legacyScore = card.valueFields?.find((field) => /score|노출|중요/i.test(field.label));
  return typeof legacyScore?.value === 'number' ? legacyScore.value : cardNewsExecutiveDefaults.exposureScore;
}

export function getTrustScore(card: CardNewsItem) {
  if (typeof card.trust_score === 'number') {
    return card.trust_score > 1 ? Math.round(card.trust_score) : Math.round(card.trust_score * 100);
  }

  const sourceScore = card.sources?.find((source) => typeof source.credibility_score === 'number')?.credibility_score;
  if (typeof sourceScore === 'number') {
    return sourceScore > 1 ? Math.round(sourceScore) : Math.round(sourceScore * 100);
  }

  return cardNewsExecutiveDefaults.trustScore;
}

export function getSummaryLines(card: CardNewsItem) {
  return card.summary_lines && card.summary_lines.length > 0 ? card.summary_lines : card.summary;
}

export function getSuggestedActions(card: CardNewsItem) {
  const apiActions = card.implication?.suggested_actions;
  return apiActions && apiActions.length > 0 ? apiActions : (card.actionItems ?? []);
}

export function getFollowUpQuestions(card: CardNewsItem) {
  return card.implication?.follow_up_questions ?? [];
}

export function getWhyImportant(card: CardNewsItem) {
  return card.implication?.why_important ?? card.detailDescription ?? '';
}

export function getPotentialImpact(card: CardNewsItem) {
  return card.implication?.potential_impact ?? card.insights[0] ?? '';
}

export function getSourceCount(card: CardNewsItem) {
  const candidates = [
    card.source_count,
    card.source_raw_article_ids?.length,
    card.sourceRawArticleIds?.length,
    card.evidence_chain?.provenance?.raw_article_ids?.length,
    card.sources?.length,
    card.evidence_chain?.source_links?.length,
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  return candidates.length > 0 ? Math.max(...candidates) : 1;
}

export function getFinancialNarrative(card: CardNewsItem) {
  const ref = card.evidence_chain?.financial_refs?.[0];
  if (ref?.narrative) {
    return ref.narrative;
  }

  if (card.financial_context?.highlights?.[0]) {
    return card.financial_context.highlights[0];
  }

  return cardNewsExecutiveDefaults.financialNarrative;
}

export function getEvidenceStatus(card: CardNewsItem) {
  const chain = card.evidence_chain;
  return {
    source: Boolean(chain?.source_links?.length || card.sources?.length),
    financial: Boolean(chain?.financial_refs?.length || card.financial_context?.linked),
    provenance: Boolean(chain?.provenance),
    market: Boolean(chain?.mbb_refs?.length),
    passed: card.validation_pass ?? chain?.pass ?? false,
    missing: chain?.missing ?? [],
  };
}

export function getEvidenceCompleteness(card: CardNewsItem) {
  const status = getEvidenceStatus(card);
  const total = [status.source, status.financial, status.provenance, status.market].filter(Boolean).length;
  return Math.round((total / 4) * 100);
}

function getImportanceScore(card: CardNewsItem) {
  if (typeof card.importance_score === 'number') {
    return card.importance_score > 1
      ? Math.round(card.importance_score)
      : Math.round(card.importance_score * 100);
  }
  return getExposureScore(card);
}

export function getExecutiveRank(cards: CardNewsItem[]) {
  return [...cards].sort((a, b) => {
    const importanceDelta = getImportanceScore(b) - getImportanceScore(a);
    if (importanceDelta !== 0) {
      return importanceDelta;
    }

    const exposureDelta = getExposureScore(b) - getExposureScore(a);
    if (exposureDelta !== 0) {
      return exposureDelta;
    }

    return getTrustScore(b) - getTrustScore(a);
  });
}

function getCardTimestamp(card: CardNewsItem) {
  const value = card.published_at ?? card.published_date ?? card.date ?? card.created_at ?? '';
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getLatestFirst(cards: CardNewsItem[]) {
  return [...cards].sort((a, b) => {
    const dateDelta = getCardTimestamp(b) - getCardTimestamp(a);
    if (dateDelta !== 0) {
      return dateDelta;
    }

    const exposureDelta = getExposureScore(b) - getExposureScore(a);
    if (exposureDelta !== 0) {
      return exposureDelta;
    }

    return getTrustScore(b) - getTrustScore(a);
  });
}

export function getCardImage(card: CardNewsItem) {
  return card.display?.background_asset_url ?? card.slides?.find((slide) => slide.image_url)?.image_url ?? card.coverImageUrl;
}

export function getCardImageAlt(card: CardNewsItem) {
  return card.slides?.find((slide) => slide.image_alt)?.image_alt ?? card.coverImageAlt;
}

export function getEvidenceChain(card: CardNewsItem): CardNewsEvidenceChain {
  return card.evidence_chain ?? {
    source_links: card.sources?.map((source) => ({
      title: source.title,
      source_name: source.source_name,
      url: source.url,
      credibility_score: source.credibility_score,
    })),
    financial_refs: [],
    mbb_refs: [],
    provenance: {
      cluster_id: typeof card.cluster_id === 'number' ? card.cluster_id : undefined,
      evidence_version: 'fallback',
    },
    pass: card.validation_pass ?? false,
    missing: [],
  };
}

function derivePeerFromTitle(title: string) {
  return cardNewsPeerTitleAliases.find(({ token }) => title.includes(token))?.label ?? null;
}
