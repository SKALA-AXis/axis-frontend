import { afterEach, describe, expect, it } from 'vitest';
import { isCallbackPath, shouldShowRawResetError } from './authRouting';

describe('shouldShowRawResetError', () => {
  it('서버/API 오류류만 원문 노출', () => {
    expect(shouldShowRawResetError('백엔드 서버에 연결할 수 없습니다')).toBe(true);
    expect(shouldShowRawResetError('API를 찾을 수 없습니다')).toBe(true);
    expect(shouldShowRawResetError('서버 오류가 발생했습니다')).toBe(true);
    expect(shouldShowRawResetError('비밀번호가 올바르지 않습니다')).toBe(false);
  });
});

describe('isCallbackPath', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('콜백 경로만 true', () => {
    window.history.pushState({}, '', '/');
    expect(isCallbackPath()).toBe(false);
    window.history.pushState({}, '', '/auth/password-reset/confirm');
    expect(isCallbackPath()).toBe(true);
    window.history.pushState({}, '', '/auth/email-verifications/confirm');
    expect(isCallbackPath()).toBe(true);
  });
});
