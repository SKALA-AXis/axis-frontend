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
