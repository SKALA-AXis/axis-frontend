import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Field, PasswordField, ToggleRow } from './SettingsFormFields';

describe('Field', () => {
  it('라벨과 기본값을 렌더한다', () => {
    render(<Field label="이름" defaultValue="홍길동" />);
    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
  });
});

describe('PasswordField', () => {
  it('입력 시 onChange 를 값으로 호출한다', () => {
    const onChange = vi.fn();
    render(<PasswordField id="settings-current-password" label="현재 비밀번호" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('현재 비밀번호'), { target: { value: 'pw' } });
    expect(onChange).toHaveBeenCalledWith('pw');
  });
});

describe('ToggleRow', () => {
  it('제목/설명 렌더 + 토글 시 onChange', () => {
    const onChange = vi.fn();
    render(<ToggleRow title="알림" description="설명" checked={false} onChange={onChange} />);
    expect(screen.getByText('알림')).toBeInTheDocument();
    expect(screen.getByText('설명')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
