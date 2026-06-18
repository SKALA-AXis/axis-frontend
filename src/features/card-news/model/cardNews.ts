/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 및 키워드 그래프 API 연동 카드뉴스 표시
 *   2026-05-12 박진 — 섹터별 오류 수정
 *   2026-05-18 최종민 — 프론트 전면 개편, Today Insight 듀얼레인 비교 컨텍스트 추가
 *   2026-05-18 박지원 — 신뢰도 점수 UI 제거, 산업 트렌드 카드뉴스 지원·소스 발행 시각 정렬 보정
 *   2026-06-14 심유정 — 카드뉴스 본문 상세 렌더링 및 전략 컨텍스트 토글 추가
 */
export type CardNewsArticlePage = {
  title: string;
  paragraphs: string[];
};

export type PeerId = 'samsung_sds' | 'lg_cns' | 'hyundai_autoever' | 'posco_dx' | 'industry_trend';
export type SectorId = 'ax' | 'security' | 'infra' | 'deal' | 'industry' | 'other';
export type ExposureBand = 'high' | 'medium' | 'low';
export type EventType = 'partnership' | 'ma' | 'personnel' | 'tech' | 'regulation' | 'new_biz' | 'contract';

export type CardNewsMediaAsset = {
  id: string;
  type: 'image';
  url: string;
  alt: string;
};

export type CardNewsTextField = {
  id: string;
  label: string;
  value: string;
};

export type CardNewsValueField = {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
};

export type CardNewsDisplayEntry = {
  id: string;
  title: string;
  subtitle?: string;
  peerCompany?: string;
  sector?: string;
  sourceType?: string;
  badgeLabel?: string;
  displayDate?: string;
  coverStyle?: string;
  previewImageStyle?: string;
};

export type CardNewsSource = {
  index?: number;
  title: string;
  url: string;
  archive_url?: string | null;
  source_name?: string;
  published_at?: string;
  credibility_grade?: 'High' | 'Medium' | 'Low' | 'Unverified';
  credibility_score?: number;
  link_status?: 'ok' | 'broken' | 'archived';
};

export type CardNewsImplication = {
  why_important?: string;
  potential_impact?: string;
  follow_up_questions?: string[];
  suggested_actions?: string[];
  key_implication_blocks?: CardNewsStructuredTextItem[];
  key_implication_items?: CardNewsStructuredTextItem[];
  response_direction_blocks?: CardNewsStructuredTextItem[];
  suggested_action_items?: CardNewsStructuredTextItem[];
  skax_checkpoint_blocks?: CardNewsStructuredTextItem[];
  confidence?: number;
};

export type CardNewsStructuredTextItem = {
  main: string;
  detail?: string;
};

export type CardNewsDisplaySection = {
  type?: 'summary' | 'insight' | 'action' | string;
  items?: string[];
  structured_items?: CardNewsStructuredTextItem[];
};

export type CardNewsEvidenceChain = {
  source_links?: Array<{
    title?: string;
    source_name?: string;
    url?: string;
    credibility_score?: number;
  }>;
  provenance?: {
    raw_article_ids?: number[];
    cluster_id?: number;
    llm_model?: string;
    prompt_version?: string;
    evidence_version?: string;
    run_at?: string;
  };
  financial_refs?: Array<{
    period?: string;
    metric?: string;
    metric_ko?: string;
    value_krwbn?: number | null;
    delta_pct_qoq?: number | null;
    delta_pct_yoy?: number | null;
    dart_rcept_no?: string | null;
    ir_page?: number | null;
    narrative?: string;
  }>;
  mbb_refs?: Array<{
    firm?: string;
    title?: string;
    url?: string;
    published_date?: string;
  }>;
  evidence_version?: string;
  pass?: boolean;
  missing?: string[];
};

export type CardNewsFinancialContext = {
  linked?: boolean;
  segment?: string;
  highlights?: string[];
};

export type CardNewsSlide = {
  order: number;
  title: string;
  body?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  evidence_source_indexes?: number[];
  layout_type?: 'title' | 'summary' | 'evidence' | 'chart' | 'implication';
};

export type CardNewsDisplayMeta = {
  home_carousel?: boolean;
  carousel_order?: number | null;
  slide_count?: number | null;
  visual_style?: 'clean' | 'hand_drawn' | 'editorial';
  background_asset_url?: string | null;
  accent_color?: string | null;
};

export type CardNewsItem = {
  id: string;
  category: string;
  date: string;
  title: string;
  coverImageUrl: string;
  coverImageAlt: string;
  summary: string[];
  articlePages: CardNewsArticlePage[];
  insights: string[];
  source: string;
  sourceUrl: string;
  detailTitle: string;
  detailDescription: string;
  detailPoints: string[];
  actionItems: string[];
  insightDetails?: CardNewsStructuredTextItem[];
  actionDetails?: CardNewsStructuredTextItem[];
  mediaAssets?: CardNewsMediaAsset[];
  textFields?: CardNewsTextField[];
  valueFields?: CardNewsValueField[];
  displayEntries?: CardNewsDisplayEntry[];
  peer_id?: PeerId;
  cluster_id?: number | null;
  subtitle?: string | null;
  category_label?: string | null;
  published_date?: string | null;
  published_at?: string | null;
  summary_lines?: string[];
  event_type?: EventType;
  sector?: SectorId;
  keywords?: string[];
  exposure_band?: ExposureBand;
  exposure_score?: number;
  importance_score?: number;
  trust_score?: number;
  implication?: CardNewsImplication;
  sources?: CardNewsSource[];
  source_count?: number | null;
  source_raw_article_ids?: number[];
  sourceRawArticleIds?: number[];
  evidence_chain?: CardNewsEvidenceChain;
  financial_context?: CardNewsFinancialContext | null;
  slides?: CardNewsSlide[];
  display_sections?: CardNewsDisplaySection[];
  display?: CardNewsDisplayMeta;
  validation_pass?: boolean | null;
  is_human_reviewed?: boolean;
  is_bookmarked?: boolean;
  strategy_context_applied?: boolean;
  strategyContextApplied?: boolean;
  strategy_context_applied_at?: string | null;
  strategyContextAppliedAt?: string | null;
  bookmark_count?: number | null;
  share_count?: number | null;
  created_at?: string;
};
