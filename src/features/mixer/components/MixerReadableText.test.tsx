import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighlightedMixerText, MixerReadableText } from './MixerReadableText';

describe('HighlightedMixerText', () => {
  it('정제된 텍스트를 렌더한다', () => {
    render(<HighlightedMixerText text="완료했습니다." />);
    expect(screen.getByText('완료했습니다.')).toBeInTheDocument();
  });
});

describe('MixerReadableText', () => {
  it('완결 문장을 렌더한다', () => {
    render(<MixerReadableText text="계약을 체결했습니다." />);
    expect(screen.getByText('계약을 체결했습니다.')).toBeInTheDocument();
  });

  it('표시할 문장이 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<MixerReadableText text="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
