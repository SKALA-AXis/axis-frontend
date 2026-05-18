import type { MixerAnalysisResponse } from '../model/mixer';

export type MixerResultView = {
  summary: string;
  insightBrief: string[];
  evidenceLogic: string[];
  actions: string[];
  connections: string[];
  skAxPerspective: string;
};

/**
 * 백엔드 MixerAnalysisResponse → UI 가 직접 쓰는 MixerResultView 변환.
 * 빈 응답에 대비해 fallback 객체로 채움.
 */
export function adaptMixerToView(
  raw: MixerAnalysisResponse,
  fallback: MixerResultView,
): MixerResultView {
  const summary = (raw.final_one_liner || raw.insight || fallback.summary).trim() || fallback.summary;
  const insightBrief = raw.bullet_signals.length > 0 ? raw.bullet_signals.slice(0, 3) : fallback.insightBrief;
  const evidenceLogic = raw.sources_used.length > 0
    ? [
        `분석 카드 ${raw.sources_used.length}건`,
        `Peer ${raw.peer_ids.length}개사`,
        `연결 ${raw.connections.length}건`,
        `신뢰도 ${Math.round((raw.confidence ?? 0) * 100)}%`,
      ]
    : fallback.evidenceLogic;
  const connections = raw.reasoning_trail.length > 0
    ? raw.reasoning_trail.map((item) => item.label).filter((s) => s.trim().length > 0)
    : fallback.connections;
  return {
    summary,
    insightBrief,
    evidenceLogic,
    actions: fallback.actions,
    connections,
    skAxPerspective: raw.sk_ax_implication.trim() || fallback.skAxPerspective,
  };
}
