import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MixerFilterGroupPanel } from './MixerFilterGroupPanel';

const options = [
  { value: 'a', label: '에이', count: 2 },
  { value: 'b', label: '비', count: 1 },
];

describe('MixerFilterGroupPanel', () => {
  it('옵션 라벨을 렌더한다', () => {
    render(
      <MixerFilterGroupPanel title="T" options={options} selected={['a']} onToggle={() => {}} emptyMessage="없음" />,
    );
    expect(screen.getByText('에이')).toBeInTheDocument();
    expect(screen.getByText('비')).toBeInTheDocument();
  });

  it('옵션이 없으면 emptyMessage 를 보여준다', () => {
    render(
      <MixerFilterGroupPanel title="T" options={[]} selected={[]} onToggle={() => {}} emptyMessage="옵션 없음" />,
    );
    expect(screen.getByText('옵션 없음')).toBeInTheDocument();
  });

  it('칩 클릭 시 onToggle 을 해당 value 로 호출한다', () => {
    const onToggle = vi.fn();
    render(
      <MixerFilterGroupPanel title="T" options={options} selected={[]} onToggle={onToggle} emptyMessage="없음" />,
    );
    fireEvent.click(screen.getByText('에이'));
    expect(onToggle).toHaveBeenCalledWith('a');
  });
});
