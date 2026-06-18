/*
 * 작성일: 2026-06-08
 * 작성자: 박진
 * 변경이력:
 *   2026-06-08 박진 — 플로팅 어시스턴트 챗 API 연동용 모델 추가, 이후 챗봇 업데이트·플로우 갱신 반영
 */
export type AssistantRole = 'user' | 'assistant' | 'system';

export type AssistantHistoryTurn = {
  role: AssistantRole;
  content: string;
};

export type AssistantPageContext = {
  route?: string;
  title?: string;
  visible_item_ids?: Record<string, string[]>;
  filters?: Record<string, unknown>;
};

export type AssistantSource = {
  type: string;
  id: string;
  title?: string;
  snippet?: string;
  url?: string;
  source_name?: string;
  source_title?: string;
  published_at?: string;
  created_at?: string;
  report_date?: string;
  updated_at?: string;
  peer_id?: string;
  event_type?: string;
  score?: number;
};

export type AssistantAnswerBlock = {
  type?: string;
  title?: string;
  items?: string[];
};

export type AssistantReportDraft = {
  title?: string;
  sections?: Array<{
    title?: string;
    body?: string;
  }>;
};

export type AssistantChatResponse = {
  conversation_id: string;
  session_id?: string;
  message_id?: string;
  reply?: string;
  message?: {
    role?: AssistantRole;
    content?: string;
  };
  intent?: string;
  scope?: string;
  answer_blocks?: AssistantAnswerBlock[];
  report_draft?: AssistantReportDraft | null;
  sources?: AssistantSource[];
  follow_up_suggestions?: string[];
  confidence?: number;
  blocked?: boolean;
  blocked_reason?: string | null;
  error_code?: string | null;
  provenance?: Record<string, unknown>;
};

export type AssistantConversationSummary = {
  conversation_id: string;
  title?: string;
  summary?: string;
  status?: string;
  message_count?: number;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type AssistantConversationDetail = {
  conversation_id: string;
  messages: Array<{
    message_id?: string;
    role: AssistantRole;
    content: string;
    intent?: string;
    sources?: AssistantSource[];
    answer_blocks?: AssistantAnswerBlock[];
    report_draft?: AssistantReportDraft | null;
    answer_payload?: {
      answer_blocks?: AssistantAnswerBlock[];
      report_draft?: AssistantReportDraft | null;
    };
    created_at?: string;
  }>;
};
