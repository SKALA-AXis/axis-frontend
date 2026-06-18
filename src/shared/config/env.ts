/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 폴더 구조 재편 과정에서 환경 설정 모듈 정리, 이후 그래프 연동 수정·목업 비활성화 반영
 */
function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  // Default to the current origin so local Vite proxying can handle `/api`
  // requests when no explicit backend URL is provided.
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  enableMockData: false,
};
