import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminAuditLogsPanel } from './AdminAuditLogsPanel';

const log = {
  id: 1,
  actorEmail: 'admin@example.com',
  action: 'card_news.delete',
  resourceType: 'card_news',
  resourceId: 'IC-1',
  resourceTitle: '카드 제목',
  reason: null,
  createdAt: '2026-06-18T10:00:00Z',
};

describe('AdminAuditLogsPanel', () => {
  it('로그 행을 렌더한다(액션 라벨 변환)', () => {
    render(<AdminAuditLogsPanel logs={[log]} isLoading={false} error={null} onReload={() => {}} />);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('카드뉴스 삭제')).toBeInTheDocument();
  });

  it('새로고침 클릭 시 onReload 호출', () => {
    const onReload = vi.fn();
    render(<AdminAuditLogsPanel logs={[]} isLoading={false} error={null} onReload={onReload} />);
    fireEvent.click(screen.getByText('새로고침'));
    expect(onReload).toHaveBeenCalled();
  });

  it('error 메시지를 표시한다', () => {
    render(<AdminAuditLogsPanel logs={[]} isLoading={false} error="조회 실패" onReload={() => {}} />);
    expect(screen.getByText('조회 실패')).toBeInTheDocument();
  });
});
