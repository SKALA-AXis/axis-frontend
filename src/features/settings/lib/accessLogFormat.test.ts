import { describe, expect, it } from 'vitest';
import type { AccessLogItem } from '../model/accessLog';
import {
  accessLogStatus,
  detectBrowser,
  detectOperatingSystem,
  formatAccessLogAction,
  formatAccessLogClient,
  formatAccessLogLocation,
  formatAccessLogTime,
} from './accessLogFormat';

const item = (over: Partial<AccessLogItem> = {}): AccessLogItem => ({
  id: '1',
  action: 'LOGIN_SUCCESS',
  success: true,
  country: '',
  ipAddress: '',
  userAgent: '',
  occurredAt: '',
  ...over,
});

describe('formatAccessLogTime', () => {
  it('무효 날짜는 "기록 없음"', () => {
    expect(formatAccessLogTime('nope')).toBe('기록 없음');
  });
  it('유효 날짜는 포맷', () => {
    expect(formatAccessLogTime('2026-06-18T10:00:00Z')).toContain('2026');
  });
});

describe('formatAccessLogAction', () => {
  it('알려진 액션은 라벨', () => {
    expect(formatAccessLogAction(item({ action: 'LOGIN_SUCCESS' }))).toBe('로그인 성공');
  });
  it('성공=false 면 "실패" 접미', () => {
    expect(formatAccessLogAction(item({ action: 'view', success: false }))).toBe('조회 실패');
  });
});

describe('formatAccessLogLocation', () => {
  it('내부망/로컬/빈값/기타 매핑', () => {
    expect(formatAccessLogLocation('내부망')).toBe('사내/내부망');
    expect(formatAccessLogLocation('로컬')).toBe('로컬 개발환경');
    expect(formatAccessLogLocation('   ')).toBe('알 수 없음');
    expect(formatAccessLogLocation('서울')).toBe('서울');
  });
});

describe('detectBrowser / detectOperatingSystem', () => {
  it('user-agent 판별', () => {
    expect(detectBrowser('Mozilla/5.0 Chrome/120 Safari/537')).toBe('Chrome');
    expect(detectBrowser('curl/8.0')).toBe('cURL');
    expect(detectBrowser('unknown')).toBe('');
    expect(detectOperatingSystem('Windows NT 10.0')).toBe('Windows');
    expect(detectOperatingSystem('iPhone OS')).toBe('iOS');
  });
});

describe('formatAccessLogClient', () => {
  it('브라우저/OS 조합, 빈값은 "기록 없음"', () => {
    expect(formatAccessLogClient('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537')).toBe('Chrome / Windows');
    expect(formatAccessLogClient('   ')).toBe('기록 없음');
  });
});

describe('accessLogStatus', () => {
  it('성공/실패/주의 라벨', () => {
    expect(accessLogStatus(item({ success: true })).label).toBe('성공');
    expect(accessLogStatus(item({ success: false, action: 'view' })).label).toBe('실패');
    expect(accessLogStatus(item({ action: 'REFRESH_REUSE_DETECTED' })).label).toBe('주의');
  });
});
