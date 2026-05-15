/**
 * ChatOrchestrator 응답 — axis-ai `/chat` 출력 스키마.
 * spec: axis-ai/design/40-user-query/chat-orchestrator.md §5
 */

export type ChatIntent =
  | 'insight'
  | 'mixer'
  | 'peer_compare'
  | 'global_trends'
  | 'link_verify'
  | 'search'
  | 'summary'
  | 'smalltalk';

export type ChatLens = 'technical' | 'financial' | 'competitive' | 'regulatory' | 'customer';

export interface ChatEntities {
  peer_ids: string[];
  sectors: string[];
  card_ids: string[];
  keywords: string[];
  date_range?: Record<string, unknown> | null;
}

export interface FollowUpSuggestion {
  label: string;
  intent: ChatIntent;
  deep_dive: boolean;
  topic_anchor?: string | null;
  lens?: ChatLens | null;
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatTurnResponse {
  reply: string;
  intent: ChatIntent;
  entities: ChatEntities;
  sources: Array<{ card_id?: string; url?: string }>;
  follow_up_suggestions: FollowUpSuggestion[];
  final_one_liner?: string | null;
  sk_ax_implication?: string | null;
  deep_dive_depth: number;
  reasoning_steps?: Array<Record<string, unknown>> | null;
  confidence: number;
  session_id: string;
  provenance: Record<string, unknown>;
  warning?: string | null;
}
