import type { AccessLogItem } from '../model/accessLog';

// 접속 로그 표시 포맷 순수 유틸 (refactoring P2/stage3). SettingsView 에서 그대로 옮긴 것.

/** ISO 시각 → ko-KR(Asia/Seoul) 표시. 무효는 "기록 없음". */
export function formatAccessLogTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '기록 없음';
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

/** 액션 코드 → 한글 라벨(실패 케이스는 "실패" 접미). */
export function formatAccessLogAction(item: AccessLogItem) {
  const labels: Record<string, string> = {
    SIGNUP: '회원가입',
    EMAIL_VERIFIED: '이메일 인증',
    EMAIL_VERIFICATION_RESENT: '인증 메일 재발송',
    LOGIN_SUCCESS: '로그인 성공',
    LOGIN_FAILURE: '로그인 실패',
    LOGOUT: '로그아웃',
    PASSWORD_RESET_REQUESTED: '비밀번호 재설정 요청',
    PASSWORD_RESET_FAILED: '비밀번호 재설정 실패',
    PASSWORD_RESET_COMPLETED: '비밀번호 재설정 완료',
    REFRESH_ROTATED: '자동 로그인 갱신',
    REFRESH_REUSE_DETECTED: '토큰 재사용 탐지',
    PASSWORD_CHANGED: '비밀번호 변경',
    PROFILE_UPDATED: '프로필 수정',
    SETTINGS_UPDATED: '설정 변경',
    login: '로그인',
    logout: '로그아웃',
    view: '조회',
    download: '다운로드',
    share: '공유',
  };
  const label = labels[item.action] ?? item.action;
  if (item.success || item.action.endsWith('_FAILURE') || item.action === 'REFRESH_REUSE_DETECTED') {
    return label;
  }
  return `${label} 실패`;
}

/** 접속 위치 라벨 정규화. */
export function formatAccessLogLocation(value: string) {
  const label = value.trim();
  if (!label) return '알 수 없음';
  if (label === '내부망') return '사내/내부망';
  if (label === '로컬') return '로컬 개발환경';
  return label;
}

/** user-agent → "브라우저 / OS" 표시. */
export function formatAccessLogClient(value: string) {
  const userAgent = value.trim();
  if (!userAgent) return '기록 없음';

  const browser = detectBrowser(userAgent);
  const os = detectOperatingSystem(userAgent);
  return [browser, os].filter(Boolean).join(' / ') || '기타 환경';
}

/** user-agent → 브라우저 명(미상은 ""). */
export function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return 'Edge';
  if (/opr\//i.test(userAgent)) return 'Opera';
  if (/firefox\//i.test(userAgent)) return 'Firefox';
  if (/chrome\//i.test(userAgent) || /crios\//i.test(userAgent)) return 'Chrome';
  if (/safari\//i.test(userAgent) && /version\//i.test(userAgent)) return 'Safari';
  if (/postmanruntime/i.test(userAgent)) return 'Postman';
  if (/^curl\//i.test(userAgent)) return 'cURL';
  if (/okhttp\//i.test(userAgent)) return 'OkHttp';
  return '';
}

/** user-agent → OS 명(미상은 ""). */
export function detectOperatingSystem(userAgent: string) {
  if (/windows nt/i.test(userAgent)) return 'Windows';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  if (/android/i.test(userAgent)) return 'Android';
  if (/mac os x|macintosh/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return '';
}

/** 접속 로그 상태 배지(성공/실패/주의) 라벨 + className. */
export function accessLogStatus(item: AccessLogItem) {
  if (item.action === 'REFRESH_REUSE_DETECTED') {
    return { label: '주의', className: 'border-[rgba(217,119,6,0.24)] bg-[rgba(217,119,6,0.10)] text-[rgb(180,83,9)]' };
  }
  if (!item.success || item.action.endsWith('_FAILURE') || item.action.endsWith('_FAILED')) {
    return { label: '실패', className: 'border-[rgba(220,38,38,0.24)] bg-[rgba(220,38,38,0.10)] text-[var(--axis-danger)]' };
  }
  return { label: '성공', className: 'border-[rgba(22,163,74,0.22)] bg-[rgba(22,163,74,0.10)] text-[var(--axis-success)]' };
}
