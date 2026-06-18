// Auth 콜백 경로 / 에러 표시 판정 순수 유틸 (refactoring P2/stage3). AuthScreen 에서 그대로 옮긴 것.

/** 현재 경로가 이메일 인증/비번 재설정 콜백 경로인지. */
export function isCallbackPath() {
  return window.location.pathname === '/auth/email-verifications/confirm' ||
    window.location.pathname === '/auth/password-reset/confirm';
}

/** 재설정 에러 중 원문 노출 대상(서버/API 오류류)인지. */
export function shouldShowRawResetError(message: string) {
  return message.includes('백엔드 서버') || message.includes('API를 찾을 수 없습니다') || message.includes('서버 오류');
}
