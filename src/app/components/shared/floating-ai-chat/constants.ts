/*
 * 작성일: 2026-06-11
 * 작성자: 안가은
 * 변경이력:
 *   2026-06-11 안가은 — 프론트엔드 대시보드/채팅 구조 정리 과정에서 채팅 상수 정의 추가
 *   2026-06-15 박진 — 사용자 챗봇 프론트엔드 업데이트 반영
 */
import { uiText } from '../../../../shared/content/uiText';

export const deviceStorageKey = 'axis:assistant-device-id';
export const greetingMessage = `${uiText.dashboard.chatGreeting} `;
export const genericAssistantErrorMessage = '기능에 문제가 생겼습니다.';

export const assistantErrorCodes = {
  chatSend: 'ASSISTANT_CHAT_SEND_FAILED',
  chatEmptyReply: 'ASSISTANT_CHAT_EMPTY_REPLY',
  pdfChat: 'ASSISTANT_PDF_CHAT_FAILED',
  pdfFileRequired: 'ASSISTANT_PDF_FILE_REQUIRED',
  pdfTooLarge: 'ASSISTANT_PDF_FILE_TOO_LARGE',
  pdfUnsupportedType: 'ASSISTANT_PDF_UNSUPPORTED_TYPE',
  conversationList: 'ASSISTANT_CONVERSATION_LIST_FAILED',
  conversationLoad: 'ASSISTANT_CONVERSATION_LOAD_FAILED',
  conversationCreate: 'ASSISTANT_CONVERSATION_CREATE_FAILED',
  conversationEnd: 'ASSISTANT_CONVERSATION_END_FAILED',
  conversationDelete: 'ASSISTANT_CONVERSATION_DELETE_FAILED',
  pdfExport: 'ASSISTANT_PDF_EXPORT_FAILED',
} as const;
