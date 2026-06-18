import { describe, expect, it } from 'vitest';
import { auditActionLabel, formatLastLogin, statusLabel, statusTone } from './adminFormat';

describe('formatLastLogin', () => {
  it('null/무효/유효', () => {
    expect(formatLastLogin(null)).toBe('기록 없음');
    expect(formatLastLogin('bad')).toBe('bad');
    expect(formatLastLogin('2026-06-18T10:00:00Z')).toContain('2026');
  });
});

describe('statusLabel', () => {
  it('상태별 한글', () => {
    expect(statusLabel('ACTIVE')).toBe('활성');
    expect(statusLabel('SUSPENDED')).toBe('정지');
    expect(statusLabel('WITHDRAWN')).toBe('탈퇴');
    expect(statusLabel('PENDING')).toBe('대기');
  });
});

describe('statusTone', () => {
  it('상태별 톤', () => {
    expect(statusTone('ACTIVE')).toBe('success');
    expect(statusTone('SUSPENDED')).toBe('warning');
    expect(statusTone('WITHDRAWN')).toBe('danger');
    expect(statusTone('PENDING')).toBe('neutral');
  });
});

describe('auditActionLabel', () => {
  it('액션 라벨 + 미상 원문', () => {
    expect(auditActionLabel('card_news.delete')).toBe('카드뉴스 삭제');
    expect(auditActionLabel('card_news.restore')).toBe('카드뉴스 복구');
    expect(auditActionLabel('unknown.action')).toBe('unknown.action');
  });
});
