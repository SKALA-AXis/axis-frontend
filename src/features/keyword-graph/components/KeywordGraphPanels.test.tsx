import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeywordGraphLoading } from './KeywordGraphPanels';

describe('KeywordGraphLoading', () => {
  it('단계 라벨과 경과 시간을 렌더한다', () => {
    render(<KeywordGraphLoading stage="requesting" elapsedSeconds={5} />);
    expect(screen.getByText('데이터 요청 중')).toBeInTheDocument();
    expect(screen.getByText('5초')).toBeInTheDocument();
  });

  it('1분 이상은 분/초로 표시한다', () => {
    render(<KeywordGraphLoading stage="rendering" elapsedSeconds={75} />);
    expect(screen.getByText('그래프 구성 중')).toBeInTheDocument();
    expect(screen.getByText('1분 15초')).toBeInTheDocument();
  });
});
