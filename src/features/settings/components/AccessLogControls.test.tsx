import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AccessLogItem } from '../model/accessLog';
import { AccessLogStatusPill } from './AccessLogControls';

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
