import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDeletedCardsPanel } from './AdminDeletedCardsPanel';

describe('AdminDeletedCardsPanel', () => {
  it('빈 상태에서도 크래시 없이 삭제 목록 패널을 렌더한다', () => {
    render(
      <AdminDeletedCardsPanel
        cards={[]}
        isLoading={false}
        error={null}
        updatingCardId={null}
        onReload={() => {}}
        onRestore={async () => {}}
      />,
    );
    expect(screen.getByText('삭제된 카드뉴스 확인 · 복구')).toBeInTheDocument();
  });
});
