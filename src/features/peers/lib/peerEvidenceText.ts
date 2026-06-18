// Peer+ 증거(evidence) 표시 텍스트 정제 순수 유틸 (refactoring P2/stage3). PeerPlusView 에서 그대로 옮긴 것.

export function normalizeEvidenceText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

const internalEvidenceMarkerPattern = /\b(?:raw_article_business_signals|raw_articles|peer_llm_analysis_snapshots|peer_companies|business_area|signal_type|raw_article_id|source_signal_ids|source_raw_article_ids|evidence_refs|evidence_id|signal_id|profile_context|input_snapshot|output_payload|top_keyword_evidence|top_keyword_reason|peer_id)\b|signal:\d+/gi;

/** 내부 식별자/테이블명 마커를 "공개 근거"로 치환 + 공백 정규화. */
export function toPublicEvidenceText(text: string) {
  return normalizeEvidenceText(
    text
      .replace(internalEvidenceMarkerPattern, '공개 근거')
      .replace(/(공개 근거[와과, ]*){2,}/g, '공개 근거 '),
  ).replace(/^[,;\s]+|[,;\s]+$/g, '');
}

/** 해석문 우선, 없으면 출처를 공개 근거 텍스트로. */
export function buildEvidenceReason(source: string, interpretation: string) {
  const cleanInterpretation = toPublicEvidenceText(interpretation);
  if (cleanInterpretation) return cleanInterpretation;

  return toPublicEvidenceText(source);
}

/** 단계 라벨(진행 내용/근거 확인 등) 제거 후 공개 근거화. */
export function stripEvidenceStageLabels(text: string) {
  return toPublicEvidenceText(text.replace(/(?:진행 내용|근거 확인|후보 정제|최종 판단):/g, ' '));
}

/** "SK AX 대비/자사" 등 주관·비교 표현을 객관 표현으로. */
export function sanitizeObjectivePeerFlowText(text: string) {
  return normalizeEvidenceText(
    text
      .replace(/SK AX와 비교했을 때/g, '')
      .replace(/SK AX와 비교해/g, '')
      .replace(/SK AX와 비교하면/g, '')
      .replace(/SK AX 대비/g, '')
      .replace(/SK AX 기준/g, '')
      .replace(/SK AX 관점에서/g, '')
      .replace(/SK AX는/g, '해당 기업은')
      .replace(/SK AX의/g, '해당 기업의')
      .replace(/자사/g, '해당 기업'),
  );
}
