import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MixerAnalysisProgressPanel } from './MixerAnalysisProgressPanel';

describe('MixerAnalysisProgressPanel', () => {
  it('단계 목록과 진행 표시를 렌더한다', () => {
    render(<MixerAnalysisProgressPanel stage={null} analysisMode="quick" />);
    expect(screen.getByText('재료 정리')).toBeInTheDocument();
    expect(screen.getByText('패턴 분석')).toBeInTheDocument();
    expect(screen.getByText('대응 방향')).toBeInTheDocument();
    expect(screen.getByText('추론 정리')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 4 단계/)).toBeInTheDocument();
  });

  it('deep 모드 설명을 보여준다', () => {
    render(<MixerAnalysisProgressPanel stage={null} analysisMode="deep" />);
    expect(screen.getByText(/정확 분석은/)).toBeInTheDocument();
  });
});
