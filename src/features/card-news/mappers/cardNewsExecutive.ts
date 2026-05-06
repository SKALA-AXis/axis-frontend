import type { CardNewsEvidenceChain, CardNewsItem, ExposureBand, PeerId, SectorId } from '../model/cardNews';

const peerLabels: Record<PeerId, string> = {
  samsung_sds: '삼성SDS',
  lg_cns: 'LG CNS',
  hyundai_autoever: '현대오토에버',
  posco_dx: '포스코DX',
};

const sectorLabels: Record<SectorId, string> = {
  security: '보안',
  ax: 'AX',
  infra: '인프라',
  biz_area: '사업영역',
  other: '기타',
};

const exposureLabels: Record<ExposureBand, string> = {
  high: 'High exposure',
  medium: 'Medium exposure',
  low: 'Low exposure',
};

export function getPeerLabel(card: CardNewsItem) {
  if (card.peer_id) {
    return peerLabels[card.peer_id];
  }

  return card.displayEntries?.[0]?.peerCompany ?? derivePeerFromTitle(card.title) ?? '전체 Peer';
}

export function getSectorLabel(card: CardNewsItem) {
  if (card.sector) {
    return sectorLabels[card.sector];
  }

  return card.category_label ?? card.category;
}

export function getDisplayDate(card: CardNewsItem) {
  return card.published_date ?? card.date;
}

export function getExposureLabel(card: CardNewsItem) {
  return card.exposure_band ? exposureLabels[card.exposure_band] : 'Watch';
}

export function getExposureScore(card: CardNewsItem) {
  if (typeof card.exposure_score === 'number') {
    return Math.round(card.exposure_score * 100);
  }

  const legacyScore = card.valueFields?.find((field) => /score|노출|중요/i.test(field.label));
  return typeof legacyScore?.value === 'number' ? legacyScore.value : 74;
}

export function getTrustScore(card: CardNewsItem) {
  if (typeof card.trust_score === 'number') {
    return card.trust_score > 1 ? Math.round(card.trust_score) : Math.round(card.trust_score * 100);
  }

  const sourceScore = card.sources?.find((source) => typeof source.credibility_score === 'number')?.credibility_score;
  if (typeof sourceScore === 'number') {
    return sourceScore > 1 ? Math.round(sourceScore) : Math.round(sourceScore * 100);
  }

  return 86;
}

export function getSummaryLines(card: CardNewsItem) {
  return card.summary_lines && card.summary_lines.length > 0 ? card.summary_lines : card.summary;
}

export function getSuggestedActions(card: CardNewsItem) {
  const apiActions = card.implication?.suggested_actions;
  return apiActions && apiActions.length > 0 ? apiActions : card.actionItems;
}

export function getFollowUpQuestions(card: CardNewsItem) {
  return card.implication?.follow_up_questions ?? [];
}

export function getWhyImportant(card: CardNewsItem) {
  return card.implication?.why_important ?? card.detailDescription;
}

export function getPotentialImpact(card: CardNewsItem) {
  return card.implication?.potential_impact ?? card.insights[0] ?? card.detailTitle;
}

export function getSourceCount(card: CardNewsItem) {
  return card.source_count ?? card.sources?.length ?? card.evidence_chain?.source_links?.length ?? 1;
}

export function getFinancialNarrative(card: CardNewsItem) {
  const ref = card.evidence_chain?.financial_refs?.[0];
  if (ref?.narrative) {
    return ref.narrative;
  }

  if (card.financial_context?.highlights?.[0]) {
    return card.financial_context.highlights[0];
  }

  return '재무 연결 정보는 상세 근거에서 확인하세요.';
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

export function getExecutiveRank(cards: CardNewsItem[]) {
  return [...cards].sort((a, b) => {
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
  if (title.includes('삼성')) return '삼성SDS';
  if (title.includes('LG')) return 'LG CNS';
  if (title.includes('현대')) return '현대오토에버';
  if (title.includes('포스코')) return '포스코DX';
  return null;
}
