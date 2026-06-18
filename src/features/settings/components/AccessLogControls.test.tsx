import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { AccessLogItem } from '../model/accessLog';
import { AccessLogPageButton, AccessLogStatusPill } from './AccessLogControls';

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

describe('AccessLogStatusPill', () => {
  it('성공 상태 라벨을 렌더한다', () => {
    render(<AccessLogStatusPill item={item({ success: true })} />);
    expect(screen.getByText('성공')).toBeInTheDocument();
  });
});

describe('AccessLogPageButton', () => {
  it('클릭 시 onClick 을 호출한다', () => {
    const onClick = vi.fn();
    render(
      <AccessLogPageButton label="다음" onClick={onClick}>
        다음
      </AccessLogPageButton>,
    );
    fireEvent.click(screen.getByText('다음'));
    expect(onClick).toHaveBeenCalled();
  });

  it('disabled 면 비활성화된다', () => {
    render(
      <AccessLogPageButton label="이전" disabled onClick={() => {}}>
        이전
      </AccessLogPageButton>,
    );
    expect(screen.getByText('이전')).toBeDisabled();
  });
});
