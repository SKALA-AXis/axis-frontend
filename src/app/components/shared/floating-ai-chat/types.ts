/*
 * 작성일: 2026-06-11
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-11 안가은 — 프론트엔드 대시보드/채팅 구조 정리 과정에서 채팅 관련 타입 정의 추가
 */
import type { ReactNode } from 'react';
import type {
  AssistantAnswerBlock,
  AssistantReportDraft,
  AssistantSource,
} from '../../../../features/assistant/model/assistant';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  sources?: AssistantSource[];
  answerBlocks?: AssistantAnswerBlock[];
  reportDraft?: AssistantReportDraft | null;
  isGreeting?: boolean;
};

export type FloatingAiChatProps = {
  activeView: string;
  onNavigate: (view: string) => void;
  scrollToTopControl?: ReactNode;
};
