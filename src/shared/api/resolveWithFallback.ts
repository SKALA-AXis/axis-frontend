/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선 과정에서 원격 호출 실패 시 목업 폴백 유틸 추가
 *   2026-06-10 박진 — 목업 비활성화 및 믹서 UX 개선, 이후 목업 삭제·챗봇 고도화 대응
 */
import { env } from '../config/env';

export async function resolveWithFallback<T>(
  remote: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await remote();
  } catch (error) {
    if (!env.enableMockData) {
      throw error;
    }
    reportMockFallback(error);
    return fallback();
  }
}

function reportMockFallback(error: unknown) {
  const detail = {
    resultKind: 'mock_data_fallback',
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };
  console.warn('[AXIS] remote request failed; mock fallback data returned', detail);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axis:fallback', { detail }));
  }
}
